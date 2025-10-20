import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CertSchema = new Schema(
  {
  title: String,
  description: String,
  validityPeriod: Number, // in months
  passingScore: Number, // percentage
  certificateTemplate: String,
  isActive: Boolean,
  totalIssued: Number,
  courseId: String,
  },
  { timestamps: true }
);

const certification = mongoose.model("certification", CertSchema);
export default certification;
