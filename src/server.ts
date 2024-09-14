// Import the Storage class from the '@google-cloud/storage' package
import { Storage } from "@google-cloud/storage";

// Import the 'dotenv' package to load environment variables from a .env file
import dotenv from "dotenv";
dotenv.config();

// Import the Express framework
import express from "express";

// Import multer for handling file uploads
import multer from "multer";

// Create an Express application
const app = express();
const upload = multer(); // Initialize multer for file uploads

// Get the 'PROJECT_ID', 'KEYFILENAME', and 'BUCKET_NAME' environment variables from the .env file
const projectId = process.env.PROJECT_ID;
const keyFilename = process.env.KEYFILE_NAME;
const bucketName = process.env.BUCKET_NAME;

// Create a new Storage object with the specified project ID and key file
const storage = new Storage({ projectId, keyFilename });

// Function to generate public URL for a file
function generatePublicUrl(bucketName: string, fileName: string) {
    return `https://storage.googleapis.com/${bucketName}/users-photo/${fileName}`;
}

// Define an asynchronous function to upload a file to Google Cloud Storage
async function uploadFile(
    bucketName: string,
    file: Express.Multer.File,
    fileOutputName: string
): Promise<any> {
    try {
        const bucket = storage.bucket(bucketName);
        const fileUpload = bucket.file(`users-photo/${fileOutputName}`); // Menyimpan di dalam folder users-photo/
        const [exists] = await fileUpload.exists(); // Cek apakah file sudah ada
        if (exists) {
            throw new Error("File already exists"); // Mengganti pesan error
        }

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        stream.on("error", (error) => {
            console.error("Error:", error);
        });

        stream.on("finish", () => {
            console.log(`File ${fileOutputName} uploaded successfully.`);
        });

        stream.end(file.buffer);

        return {
            message: "File uploaded successfully",
            public_url: generatePublicUrl(bucketName, fileOutputName),
        };
    } catch (error) {
        console.error("Error:", error);
        throw error; // Melempar kembali error untuk penanganan lebih lanjut
    }
}

async function getFile(bucketName: string, fileOutputName: string): Promise<any> {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`users-photo/${fileOutputName}`); // Menyimpan di dalam folder users-photo/
    const [exists] = await file.exists(); // Cek apakah file ada
    if (!exists) {
        throw new Error("File not found"); // Mengganti pesan error
    }
    const ret = await file.download();
    return {
        message: "File retrieved successfully",
        data: {
            public_url: generatePublicUrl(bucketName, fileOutputName),
        },
    };
}

async function updateFile(
    bucketName: string,
    fileOutputName: string,
    newFile: Express.Multer.File
): Promise<any> {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`users-photo/${fileOutputName}`); // Menyimpan di dalam folder users-photo/

    // Cek apakah file ada sebelum mengupdate
    const [exists] = await file.exists();
    if (!exists) {
        throw new Error("File not found"); // Mengganti pesan error
    }

    const stream = file.createWriteStream({
        metadata: {
            contentType: newFile.mimetype,
        },
    });

    stream.on("error", (error) => {
        console.error("Error:", error);
    });

    stream.on("finish", () => {
        console.log(`File ${fileOutputName} updated successfully.`);
    });

    stream.end(newFile.buffer);

    return {
        message: "File updated successfully",
        public_url: generatePublicUrl(bucketName, fileOutputName),
    };
}

async function deleteFile(bucketName: string, fileOutputName: string): Promise<any> {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`users-photo/${fileOutputName}`); // Menyimpan di dalam folder users-photo/

    // Cek apakah file ada sebelum menghapus
    const [exists] = await file.exists();
    if (!exists) {
        throw new Error("File not found"); // Mengganti pesan error
    }

    // Delete the file
    await file.delete();

    return { message: "File deleted successfully" };
}

// Define routes for the Express application to handle file uploads, retrieval, updates, and deletion
app.post("/uploads", upload.single("file"), (req, res) => {
    const fileOutputName = req.body.fileOutputName;
    if (bucketName && req.file && fileOutputName) {
        uploadFile(bucketName, req.file, fileOutputName)
            .then((ret) => {
                console.log(ret);
                res.status(200).send({
                    code: 200,
                    message: ret.message,
                    data: {
                        public_url: ret.public_url,
                    },
                });
            })
            .catch((error) => {
                console.error("Error:", error);
                if (error.message === "File already exists") {
                    res.status(409).send({ code: 409, message: "File already exists" }); // 409 Conflict jika file sudah ada
                } else {
                    res.status(500).send({
                        code: 500,
                        message: "Failed to upload file",
                        error: error.message,
                    });
                }
            });
    } else {
        console.error("Error: Missing required parameters for file upload.");
        res.status(400).send({
            code: 400,
            message: "Missing required parameters for file upload.",
        });
    }
});

app.get("/uploads", async (req, res) => {
    const fileOutputName = req.query.fileOutputName as string;
    if (bucketName && fileOutputName) {
        try {
            const data = await getFile(bucketName, fileOutputName);
            res.status(200).send({
                code: 200,
                message: data.message,
                data: {
                    public_url: data.data.public_url,
                },
            });
        } catch (error) {
            console.error("Error:", error);
            res.status(404).send({ code: 404, message: "File not found" }); // Mengubah status code dan pesan
        }
    } else {
        console.error("Error: Missing required parameters for file retrieval.");
        res.status(400).send({
            code: 400,
            message: "Missing required parameters for file retrieval.",
        });
    }
});

app.put("/uploads", upload.single("file"), async (req, res) => {
    const fileOutputName = req.body.fileOutputName;
    if (bucketName && fileOutputName && req.file) {
        try {
            // Cek keberadaan file sebelum mengupdate
            await getFile(bucketName, fileOutputName);
            const ret = await updateFile(bucketName, fileOutputName, req.file);
            console.log(ret);
            res.status(200).send({
                code: 200,
                message: ret.message,
                data: {
                    public_url: ret.public_url,
                },
            });
        } catch (error) {
            console.error("Error:", error);
            if (error.message === "File not found") {
                res.status(404).send({ code: 404, message: "File not found" }); // Mengubah status code dan pesan
            } else {
                res.status(500).send({
                    code: 500,
                    message: "Failed to update file",
                    error: error.message,
                });
            }
        }
    } else {
        console.error("Error: Missing required parameters for file update.");
        res.status(400).send({
            code: 400,
            message: "Missing required parameters for file update.",
        });
    }
});

app.delete("/uploads", async (req, res) => {
    const fileOutputName = req.query.fileOutputName as string; // Menggunakan query parameter untuk nama file
    if (bucketName && fileOutputName) {
        deleteFile(bucketName, fileOutputName)
            .then((ret) => {
                console.log(ret);
                res.status(200).send({
                    code: 200,
                    message: ret.message,
                });
            })
            .catch((error) => {
                console.error("Error:", error);
                if (error.message === "File not found") {
                    res.status(404).send({ code: 404, message: "File not found" }); // Mengubah status code dan pesan
                } else {
                    res.status(500).send({
                        code: 500,
                        message: "Failed to delete file",
                        error: error.message,
                    });
                }
            });
    } else {
        console.error("Error: Missing required parameters for file deletion.");
        res.status(400).send({
            code: 400,
            message: "Missing required parameters for file deletion.",
        });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
