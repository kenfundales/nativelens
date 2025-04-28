import axios from "axios";


const API_URL = "http://13.211.144.239:5000"; // Change to EC2 IP when deployed

// Fetch tree details by ID
export const fetchTreeDetails = async (treeId: string) => {
  try {
    console.log("Fetching from API:", `${API_URL}/trees/${treeId}`);
    const response = await axios.get(`${API_URL}/trees/${treeId}`, { timeout: 5000 });
    console.log("Full API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error:", error.message);
    return null;
  }
};

// Fetch locations for a tree by ID
export const fetchTreeLocations = async (treeId: string) => {
  try {
    console.log("Fetching from API:", `${API_URL}/trees/${treeId}/locations`);
    const response = await axios.get(`${API_URL}/trees/${treeId}/locations`, { timeout: 5000 });
    console.log("Full API Response:", response.data);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    console.log("No valid location data found.");
    return [];
  } catch (error) {
    console.error("API error:", error.message);
    return [];
  }
};

// Add a new location
export const addTreeLocation = async (treeId: string, latitude: number, longitude: number) => {
  try {
    console.log("Posting to API:", `${API_URL}/locations`);
    const response = await axios.post(
      `${API_URL}/locations`,
      { tree_id: treeId, latitude, longitude },
      { timeout: 5000 }
    );
    console.log("Full API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error:", error.message);
    return null;
  }
};