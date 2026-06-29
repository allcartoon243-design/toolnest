// app.js
import { removeBackgroundWithImgly } from './tools.js';

window.handleBgRemove = async function(file) {
    const status = document.getElementById('bgStatus');
    const statusText = document.getElementById('bgStatusText');
    status.style.display = 'block';
    statusText.textContent = 'Processing with AI...';
    
    try {
        const blob = await removeBackgroundWithImgly(file);
        const url = URL.createObjectURL(blob);
        document.getElementById('bgOutput').src = url;
        document.getElementById('bgResult').classList.add('show');
        status.style.display = 'none';
        document.getElementById('bgDown').onclick = () => {
            const a = document.createElement('a');
            a.href = url; a.download = 'toolnest-nobg.png'; a.click();
        };
    } catch (e) {
        statusText.textContent = 'Error: ' + e.message;
    }
};
