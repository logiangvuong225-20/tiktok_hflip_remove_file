const form = document.getElementById('form');
const loading = document.getElementById('loading');
const downloadButton = document.getElementById('downloadButton');
const fileNameDiv = document.getElementById('fileName');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const urlInput = document.getElementById('url').value;
    loading.style.display = 'block';
    downloadButton.style.display = 'none';

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) {
            throw new Error('Network ko thể trả về ');
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        const videoUrl = data.videoUrl;

        const videoElement = document.createElement('video');
        videoElement.controls = true;
        const sourceElement = document.createElement('source');
        sourceElement.src = videoUrl;
        sourceElement.type = 'video/mp4';
        videoElement.appendChild(sourceElement);

        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = '';
        contentDiv.appendChild(videoElement);

        loading.style.display = 'none';
        downloadButton.style.display = 'inline-block';
    } catch (error) {
        console.error('Ko thể nạp video:', error);
        loading.textContent = 'Lỗi get video. Vui lòng thử lại.';
    }

    document.getElementById('url').value = '';
});

let downloadCount = 1;

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

downloadButton.addEventListener('click', async function () {
    const sourceElement = document.querySelector('video > source');
    const videoUrl = sourceElement.getAttribute('src');
    const randomString = generateRandomString(8);
    const fileName = `video_${downloadCount}_${randomString}.mp4`;

    try {
        const response = await fetch('/flip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoUrl, fileName })
        });

        if (!response.ok) {
            throw new Error('lỗi phản hồi');
        }

        fileNameDiv.textContent = fileName;

        downloadCount++;
    } catch (error) {
        console.error('Lỗi lật video:', error);
    }
});

document.getElementById('submit').addEventListener('click', function() {
    document.getElementById('fileName').innerHTML = '';
    document.querySelector('video > source').src = '';
});
