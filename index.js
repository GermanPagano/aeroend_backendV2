// 📁 backend/index.js AEROEND
/*comentarios e */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const cors = require('cors'); // 👈 esto

const app = express();
app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 5000;

// Autenticación con Google Drive
const auth = new google.auth.GoogleAuth({
 /* keyFile: '/etc/secrets/credentials.json',*/
 keyFile: path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  

});

const driveService = google.drive({ version: 'v3', auth });

// Ruta para recibir archivo y subirlo a Google Drive
app.post('/upload', upload.any(), async (req, res) => {
  try {
    const file = req.files.find((f) => f.fieldname === "file");
    if (!file) {
      return res.status(400).send("Archivo no recibido");
    }

    const tempPath = file.path;
    const originalname = file.originalname;
    const customFileName = req.body.customFileName;
    const receivedFolderId = req.body.folderId;

    console.log("🟢 Recibido:", { customFileName, receivedFolderId });

    const folderId = receivedFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name: customFileName || originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: fs.createReadStream(tempPath),
    };

    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    fs.unlinkSync(tempPath); // eliminar archivo temporal

    res.status(200).json({ fileId: response.data.id });
  } catch (err) {
    console.error("❌ Error subiendo a Drive:", err);
    res.status(500).send("Error interno del servidor");
  }
});


app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
