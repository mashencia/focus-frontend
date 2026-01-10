//Variable storing the location of the backend
//import.meta.env exposed env vars to frontend (the way it works in Vite)
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5173";

//Acts like "fetch"
//ArgumentsL path (/api/focus/...) adn options (POST/GET)
//Permissable for imports
//options = {} so that the default won't permit crashing
export async function api(path, options = {}){
    //fetch is called completely wit the api base (local host) and the respective path
    const result =  await fetch(`${API_BASE}${path}`, {
        headers: {"Content-Type":"application/json", ...(options.headers || {})}, //JSON content
        ...options,
    });

    //Receiving as text 
    const text = await result.text();
    //Parsing the text into JSON
    const data = text?JSON.parse(text):null;

    //Exceptions/errors on the backend --> frontend
    if(!result.ok){
        const msg = data?.error || data?.message || result.statusText;
        throw new Error(msg);
    }

    return data;
}