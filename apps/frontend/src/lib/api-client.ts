const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type RequestOptions = {

  method?: string;

  body?: any;

  headers?: Record<string, string>;

  token?: string; // Optional manual token override

  responseType?: 'json' | 'blob'; // Opsi baru

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

    

    // Handle Blob Response explicitly requested

    if (options.responseType === 'blob') {

        if (!response.ok) {

            const text = await response.text();

             throw new Error(text || "Download failed");

        }

        return await response.blob();

    }



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

  get: (endpoint: string, options?: RequestOptions) => request(endpoint, { method: "GET", ...options }),

  post: (endpoint: string, body: any, options?: RequestOptions) => request(endpoint, { method: "POST", body, ...options }),

  put: (endpoint: string, body: any, options?: RequestOptions) => request(endpoint, { method: "PUT", body, ...options }),

  delete: (endpoint: string, options?: RequestOptions) => request(endpoint, { method: "DELETE", ...options }),

};
