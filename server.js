import http from "http";
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from "path";
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const _filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(_filename);

const server = http.createServer(async (req, res) => { 
    // LOGGER (Our simple Middleware)
    console.log(`[${req.method}] Request for: ${req.url}`);

    // If the URL does not start with /api, it's a request for a static file (HTML, CSS, JS)
    if (!req.url.startsWith("/api")) {
        // If the user requests "/", we actually want to serve "index.html"
        const fileName = req.url === "/" ? "index.html" : req.url;
        const filePath = path.join(__dirname, "public", fileName);

        try {
            const data = await fs.readFile(filePath);
            
            // Figure out the Content-Type based on the file extension
            let contentType = "text/plain";
            if (fileName.endsWith(".html")) contentType = "text/html";
            if (fileName.endsWith(".css")) contentType = "text/css";
            if (fileName.endsWith(".js")) contentType = "application/javascript";

            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        } catch (err) {
            // If the file doesn't exist (e.g., /banana.css), send 404
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("File Not Found");
        }
        return; // Stop executing here so it doesn't go to the API routes!
    }
    if (req.url === "/api/notes" && req.method === "GET") {
        try {
            const filePath = path.join(__dirname, "data", "notes.json");
            const data = await fs.readFile(filePath, "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to read notes" }));
        }
        return;
    }
    if (req.url === "/api/notes" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });

        req.on("end", async () => {
            try {
                const parsedBody = JSON.parse(body);
                const { text } = parsedBody;
                // SANITIZATION: Check if text exists and is a string
                if (!text || typeof text !== "string") {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Note text is required" }));
                }
                // Create the new note with a UUID
                const newNote = {
                    id: uuidv4(),
                    text: text
                };
                // Read existing notes
                const filePath = path.join(__dirname, "data", "notes.json");
                const data = await fs.readFile(filePath, "utf-8");
                const notes = JSON.parse(data);
                // Push and save
                notes.push(newNote);
                await fs.writeFile(filePath, JSON.stringify(notes, null, 2));

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(newNote));

            } catch (err) {
                 console.log("THE ERROR IS:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to save note" }));
            }
        });
        return;
    }

        if (req.url.startsWith("/api/notes/") && req.method === "DELETE") {
        try {
            // Extract the ID from the URL (e.g., "/api/notes/123-456" becomes "123-456")
            const idToDelete = req.url.split("/")[3]; 

            const filePath = path.join(__dirname, "data", "notes.json");
            const data = await fs.readFile(filePath, "utf-8");
            let notes = JSON.parse(data);

            // Filter out the note with the matching ID
            const updatedNotes = notes.filter(note => note.id !== idToDelete);

            // If the length didn't change, the ID wasn't found
            if (notes.length === updatedNotes.length) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Note not found" }));
            }

            // Save the updated array back to the file
            await fs.writeFile(filePath, JSON.stringify(updatedNotes, null, 2));

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Note deleted successfully" }));

        } catch (err) {
            console.log(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to delete note" }));
        }
        return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API Route not found" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});