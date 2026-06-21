export const QTYPE = { 1: "Multiple Choice", 2: "True/False", 3: "Short Answer" };
export const DIFF = { 1: "Easy", 2: "Medium", 3: "Hard" };
export const DIFF_TAG = { 1: "tag-easy", 2: "tag-medium", 3: "tag-hard" };

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export const errMsg = (e) =>
  e?.response?.data?.message || e?.message || "An error occurred";
