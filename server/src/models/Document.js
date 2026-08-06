import mongoose from "mongoose";

const { Schema } = mongoose;

const PageSchema = new Schema(
  {
    page_number: { type: Number, required: true },
    text: { type: String, default: "" },
    confidence: { type: Number, default: null },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const DocumentSchema = new Schema(
  {
    document_id: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    page_count: { type: Number, required: true },
    pages: { type: [PageSchema], default: [] },
    full_text: { type: String, default: "" },

    // AI-derived fields, populated lazily as the user requests them
    document_type: { type: String, default: null },
    summary: { type: String, default: null },
    qa_history: {
      type: [
        new Schema(
          { question: String, answer: String, asked_at: { type: Date, default: Date.now } },
          { _id: false }
        ),
      ],
      default: [],
    },
    translations: { type: Map, of: String, default: {} },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Document", DocumentSchema);
