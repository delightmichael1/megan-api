import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "@/models/user";
import nodemailer from "nodemailer";
import { Mutex } from "async-mutex";
import device from "@/models/device";
import { Request, Response } from "express";

//GENERATION OF THE ACCESS TOPKENS USING THE USER INFO

const generateAccessAndRefreshTokens = async (userData: any) => {
    try {
        const accessToken = jwt.sign(
            {
                _id: userData._id,
                email: userData.email,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m",
            }
        );;
        const refreshToken = jwt.sign(
            {
                _id: userData._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "15d",
            }
        );
        userData.refreshToken = refreshToken;
        await userData.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error(error.message);
    }
};

//FUNCTION TO HANDLE DEVICE AUTH

const handleDeviceAuth = async ({req, accessToken, refreshToken, userId}: any) => {
    try {
        const deviceId = req.header("X-Device-Id");
        const model = req.header("X-Device-Model");
        const name = req.header("X-Device-Name");

        if (!deviceId) {
            return { status: 401, error: new Error("invalid credentials") };
        }

        // Find device
        const deviceData = await device.findOne({ deviceID: deviceId });

        if (!deviceData) {
            // Insert new device
            const deviceData = {
                online: true,
                deviceName: name,
                Model: model,
                deviceID: deviceId,
                deviceToken: accessToken,
                refreshToken: refreshToken,
                userId: userId,
                lastSeen: new Date().toISOString()
            };

             await device.create(deviceData);
        } else {
            // Update device
            const modified = await device.updateOne(
                { deviceID: deviceId }, {
                    $set: {
                        online: true,
                        deviceToken: accessToken,
                        refreshToken: refreshToken,
                        lastSeen: new Date().toISOString()
                    }
            })
            
            if (modified.modifiedCount === 0) {
                return { status: 401, error: new Error("invalid credentials") };
            }
        }

        return { status: 0, error: null };
    } catch (err) {
        return { status: 500, error: new Error("internal server error") };
    }
}

//FUNCTION TO ADD ALL THE USERS

export const handleAdduser = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const userData = req.body;
        const salt = await bcrypt.genSalt(10);
        const password = Math.floor(10000000 + Math.random() * 90000000).toString();
        const hashedPassword = await bcrypt.hash(password, salt);
        const permissions = req.body.permissions
        const newuser = new user({ ...req.body, password: hashedPassword, permissions: permissions });
        await newuser.save();

        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_ACCOUNT,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            to: userData.email,
            subject: "POSB",
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>POSB Account Creation</title>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;  }
                            .container { max-width: 500px; background: #ffffff; padding: 20px; margin: 50px auto; border-radius: 8px; 
                                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4); text-align: center; border-width: 1px; border-color: rgb(145, 132, 132)}
                            .logo { width: 120px; margin-bottom: 20px; }
                            .otp { font-size: 24px; font-weight: bold; color: #2d89ff; background: #f1f7ff; padding: 10px 20px;
                            display: inline-block; border-radius: 5px; margin: 10px 0; }
                            .footer { font-size: 12px; color: #777; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>POSB Account Creation</h2>
                            <p> Hi @${userData.email}. We welcome you to POSB Team. Below is your One Time Password, Change it as soon as you Log In:</p>
                            <div class="otp">${password}</div>
                            <div class="footer">
                                <p>© 2025 POSB. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>`
        };
        transporter.sendMail(mailOptions);
        res.status(200).json({ message: "User added successfully." });
    } catch (error: any) {
        res.status(400).json({ message: "Failed to create user" });
        console.log(error);
    }
};

//FUNCTION TO HANDLE MOBILE APP SIGN IN

export const handleSignIn = async (req: Request, res: Response): Promise<Response | void> => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const userData = await user.findOne({ email });

        if (!userData) {
            return res.status(404).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
            userData
        )

        const { status, error } = await handleDeviceAuth({req, accessToken, refreshToken, userId: userData._id});

        if (status !== 0) {
            return res.status(500).json({ message: error?.message });
        }

        return res
            .status(200)
            .json({
                accessToken,
                refreshToken,
                message: "Logged in successfully",
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

//FUNCTION  TO UPDATE THE USER PASSWORD

export const handleUpdatePassword = async (req: Request, res: Response) => {
    try {
        const id = req.body._id;
        const currentPassword = req.body.currentPassword;
        const userDetails = await user.findOne({ _id: req.body._id });
        if (!userDetails) {
            throw ("user not found");
        } else {
            if (userDetails.password) {
                let isValid = await bcrypt.compare(currentPassword, userDetails.password);
                if (isValid) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
                    const result = await user.updateOne({ _id: id }, { ...req.body, password: hashedPassword });
                    if (result.modifiedCount === 1) {
                        res.status(200).json({ message: 'Password updated successfully' });
                    } else {
                        res.status(404).json({ message: 'Failed to update the password' });
                    }
                } else {
                    res.status(404).send('Invalid Password');
                }
            }
        }
    } catch (error: any) {
        res.status(404).send('Failed to update password.');
    }
}

export const handleSignUpUser = async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        if (!userData.email || !userData.password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        console.log(userData);

        const existingUser = await user.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const userdata = new user({ ...userData, password: hashedPassword, permissions: userData.permissions ?? [""] });

        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_ACCOUNT,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            to: userData.email,
            subject: "POSB",
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>POSB Account Creation</title>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;  }
                            .container { max-width: 500px; background: #ffffff; padding: 20px; margin: 50px auto; border-radius: 8px; 
                                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4); text-align: center; border-width: 1px; border-color: rgb(145, 132, 132)}
                            .logo { width: 120px; margin-bottom: 20px; }
                            .otp { font-size: 24px; font-weight: bold; color: #2d89ff; background: #f1f7ff; padding: 10px 20px;
                            display: inline-block; border-radius: 5px; margin: 10px 0; }
                            .footer { font-size: 12px; color: #777; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>POSB Account Creation</h2>
                            <p> Hi @${userData.email}. We welcome you to POSB Team. Below is your One Time Password, Change it as soon as you Log In:</p>
                            <div class="otp">${userData.password}</div>
                            <div class="footer">
                                <p>© 2025 POSB. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>`
        };
        transporter.sendMail(mailOptions);
        await userdata.save();
        res.status(200).json({ message: 'User created successfully', user: userdata });
    } catch (error: any) {
        res.status(400).json({ message: 'Failed to create user' });
    }
}

// FUNCTION TO UPDATE THE USER DATA

export const handleUpdateuserInfo = async (req: Request, res: Response) => {
    try {
        const id = req.body._id;
        const updatedData = req.body;

        if (!id || !updatedData) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const userdata = await user.findById(id);

        if (!userdata) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newUserData = {
            ...updatedData,
            password: userdata.password,
        }

        const result = await user.updateOne({ _id: id }, {$set: newUserData});

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'user updated successfully' });
        } else {
            res.status(404).json({ message: 'user not found' });
        }
    } catch (error: any) {
        console.log(error)
        res.status(404).json({ message: 'Failed to update user' });
    }
};

// FUNCTION TO GET THE USER USING THE USER ACCESS TOKEN

export const handleGetUser = async (req: Request, res: Response) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const userData = await user.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        res.status(200).json({ user: userData });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ message: 'Error getting user' });
    }
};

//FUNCTION TO DELETE USER

export const handleDeleteUser = async (req: Request, res: Response) => {
    try {
        const userFound = await user.findByIdAndDelete(req.params.id);
        if (!userFound) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to delete user' });
    }
}

// FUNCTION TO REFRESH THE USER ACCESS TOKEN

const refreshTokenCache: Map<string, { token: string; expiration: number }> = new Map();
const accessTokenCache: Map<string, { token: string; expiration: number }> = new Map();

// Per-device locks
const deviceLocks: Map<string, Mutex> = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [deviceId, entry] of refreshTokenCache.entries()) {
    if (now > entry.expiration) refreshTokenCache.delete(deviceId);
  }
  for (const [deviceId, entry] of accessTokenCache.entries()) {
    if (now > entry.expiration) accessTokenCache.delete(deviceId);
  }
}, 60_000);

export const refreshUserAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.headers.authorization?.split(" ")[1];
  const deviceID = req.header("X-Device-Id");

  if (!incomingRefreshToken || !deviceID) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  // Get/create lock for device
  if (!deviceLocks.has(deviceID)) {
    deviceLocks.set(deviceID, new Mutex());
  }
  const lock = deviceLocks.get(deviceID)!;

  return lock.runExclusive(async () => {
    try {
      // 1. Check cache first
      const cachedRefresh = refreshTokenCache.get(deviceID);
      const cachedAccess = accessTokenCache.get(deviceID);
      const now = Date.now();

      if (
        cachedRefresh &&
        cachedAccess &&
        now < cachedRefresh.expiration &&
        now < cachedAccess.expiration
      ) {
        return res.status(200).json({
          accessToken: cachedAccess.token,
          refreshToken: cachedRefresh.token,
          message: "Token refreshed successfully (from cache)",
        });
      }

      // 2. Load from DB
      const deviceData = await device.findOne({ deviceID });
      if (!deviceData) {
        return res.status(401).json({ message: "invalid credentials" });
      }

      if (deviceData.refreshToken !== incomingRefreshToken) {
        return res.status(401).json({ message: "invalid credentials" });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!);
      } catch {
        return res.status(401).json({ message: "invalid credentials" });
      }

      const userData = await user.findById(decoded._id);
      if (!userData) {
        return res.status(404).json({ message: "invalid credentials" });
      }

      // 3. Generate new tokens
      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userData);

      // Update device with new refresh token
      deviceData.refreshToken = refreshToken;
      await deviceData.save();

      // 4. Save to cache (valid for 2 minutes)
      const expiration = Date.now() + 2 * 60 * 1000;
      refreshTokenCache.set(deviceID, { token: refreshToken, expiration });
      accessTokenCache.set(deviceID, { token: accessToken, expiration });

      return res.status(200).json({
        accessToken,
        refreshToken,
        message: "Token refreshed successfully",
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });
};

export const handleSignOut = async (req: Request, res: Response) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken._id
        const deviceID = req.header("X-Device-Id");

        const devicedata = await device.findOne({ deviceID: deviceID, userId: userId });

        if (!devicedata) {
            return res.status(404).json({message: "Device not found"});
        }

        await device.updateOne({ deviceID: deviceID, userId: userId }, { online: false, lastSeen: new Date().toISOString() });

        res.status(200).json({ message: "User signed out successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const handleGetUsers = async (req: any, res: any) => {
    try {
        const users = await user.find();
        res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}