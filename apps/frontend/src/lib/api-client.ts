const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string; // Optional manual token override
};

// Helper internal (tidak diexport)
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const request = async (endpoint: string, options: RequestOptions = {}) => {
  const token = options.token || getToken();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  // Only set application/json if not FormData. 
  // Browser will set Content-Type: multipart/form-data; boundary=... automatically for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // Cek tipe konten
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      // Jika bukan JSON (misal error 500 text/plain), baca sebagai text
      const text = await response.text();
      data = { message: text || response.statusText };
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Export sebagai object constant
export const apiClient = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) => request(endpoint, { method: "POST", body }),
  put: (endpoint: string, body: any) => request(endpoint, { method: "PUT", body }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
};