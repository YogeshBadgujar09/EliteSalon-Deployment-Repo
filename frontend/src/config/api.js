export const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export const RAZORPAY_KEY =
  process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_SPZsgkIqFM9JER";

/**
 * Resolves uploaded image URLs across both Cloudinary (`https://...`) and legacy local filenames.
 */
export const getImageUrl = (
  folder,
  value,
  defaultFile = "defaultProfile.png"
) => {
  if (
    !value ||
    value === "defaultProfile.png" ||
    value.startsWith("default/")
  ) {
    return `${API_URL}/uploads/default/${defaultFile}`;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${API_URL}/uploads/${folder}/${value}`;
};

export const getAuthHeaders = (tokenKey = "token") => {
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
