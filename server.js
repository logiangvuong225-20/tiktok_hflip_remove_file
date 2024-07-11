const express = require("express");
const https = require("https");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const pathToFfmpeg = "bin\\ffmpeg.exe";
ffmpeg.setFfmpegPath(pathToFfmpeg);
const fs = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);
const { v4: uuidv4 } = require('uuid');

const app = express();
const videoDirectory = path.join(__dirname, 'videos');
const downloadDirectory = path.join(__dirname, 'downloads');

if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory);
}

if (!fs.existsSync(downloadDirectory)) {
    fs.mkdirSync(downloadDirectory);
}

app.use(express.static("public"));
app.use(express.json());

app.post("/download", (req, res) => {
  const videoUrl = req.body.url;
  const encodedUrl = encodeURIComponent(videoUrl);

  const options = {
    method: "GET",
    hostname: "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
    path: `/index?url=${encodedUrl}`,
    headers: {
      "x-rapidapi-key": "API_KEY",
      "x-rapidapi-host": "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let chunks = [];

    apiRes.on("data", (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      let jsonData;

      try {
        jsonData = JSON.parse(body);
      } catch (error) {
        return res.status(500).json({ error: "Không thể phân tích cú pháp phản hồi API" });
      }

      if (!jsonData || !jsonData.video || !Array.isArray(jsonData.video) || jsonData.video.length === 0) {
        return res.status(500).json({ error: "API không hợp lệ" });
      }

      const videoUrl = jsonData.video[0];
      res.json({ videoUrl });
    });
  });

  apiReq.on("error", (error) => {
    console.error("API request lỗi:", error);
    res.status(500).json({ error: "API request thất bại" });
  });

  apiReq.end();
});

app.post("/flip", async (req, res) => {
  const { videoUrl, fileName } = req.body;
  const uniqueId = uuidv4();
  const videoPath = path.join(videoDirectory, `${uniqueId}.mp4`);
  const outputPath = path.join(__dirname, 'downloads', fileName); 

  try {
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error('Lỗi fetch');

    await streamPipeline(response.body, fs.createWriteStream(videoPath));

    ffmpeg(videoPath)
      .videoFilter('hflip')
      .save(outputPath)
      .on('end', () => {
        setTimeout(() => {
          fs.unlink(videoPath, (err) => {
            if (err) {
              console.error('Ko thể xóa video gốc:', err);
            }
          });
          fs.unlink(outputPath, (err) => {
            if (err) {
              console.error('Ko thể xóa video flip:', err);
            }
          });
        },5 * 60 * 1000); // thiết lập tgian tại đây

        res.download(outputPath, (err) => {
          if (err) {
            console.error('Error:', err);
          }
        });
      })
      .on('error', (err) => {
        console.error('Error:', err);
        res.status(500).send({ error: 'xảy ra lỗi' });
        fs.unlink(videoPath, (err) => {
          if (err) {
            console.error('Ko thể xóa vid gốc:', err);
          }
        });
      });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send({ error: 'xảy ra lỗi' });
  }
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const ports = [4200];
ports.forEach(port => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`server actived - port: ${port}`);
  });
});
