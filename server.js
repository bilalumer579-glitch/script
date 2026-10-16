const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const photosPath = path.join(
  process.env.USERPROFILE,
  "Desktop",
  "photos",
  "photos"
);

// Apna username aur password set karo
const USERNAME = process.env.GALLERY_USER;
const PASSWORD = process.env.GALLERY_PASS;
// Password ke baghair gallery nahi khulegi
app.use((req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Wedding Photos"');
    return res.status(401).send("Password required");
  }

  let credentials;

  try {
    credentials = Buffer.from(
      auth.split(" ")[1],
      "base64"
    ).toString();
  } catch {
    return res.status(401).send("Invalid login");
  }

  const colon = credentials.indexOf(":");
  const username = credentials.slice(0, colon);
  const password = credentials.slice(colon + 1);

  if (username !== USERNAME || password !== PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="Wedding Photos"');
    return res.status(401).send("Wrong username or password");
  }

  next();
});

app.get("/", (req, res) => {
  if (!fs.existsSync(photosPath)) {
    return res.status(404).send("Photos folder nahi mila.");
  }

  const files = fs.readdirSync(photosPath)
    .filter(file => /\.(jpe?g|png|webp|gif)$/i.test(file));

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Wedding Photo Gallery</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: #fae3e8;
          color: #8b3154;
          text-align: center;
        }
        h1 { color: #a33d62; }
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .card {
          background: white;
          padding: 8px;
          border-radius: 12px;
        }
        img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <h1>Wedding Photo Gallery ❤️</h1>
      <p>${files.length} photos</p>
      <div class="gallery">
        ${files.map(file => {
          const url = "/photos/" + encodeURIComponent(file);
          return `
            <div class="card">
              <a href="${url}" target="_blank">
                <img loading="lazy" src="${url}" alt="Wedding photo">
              </a>
              <p><a href="${url}" download>Download photo</a></p>
            </div>`;
        }).join("")}
      </div>
    </body>
    </html>
  `);
});

app.use("/photos", express.static(photosPath, { index: false }));

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Gallery ready at http://127.0.0.1:3000");
});
