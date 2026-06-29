import { removeBackgroundWithImgly } from './tools.js';

export async function handleBgRemove(file) {
    const status = document.getElementById('bgStatus');
    const statusText = document.getElementById('bgStatusText');
    const resultBox = document.getElementById('bgResult');
    
    if (status) status.style.display = 'block';
    if (statusText) statusText.textContent = 'Processing with AI...';
    
    try {
        const blob = await removeBackgroundWithImgly(file);
        const url = URL.createObjectURL(blob);
        
        document.getElementById('bgOutput').src = url;
        if (resultBox) resultBox.classList.add('show');
        if (status) status.style.display = 'none';
        
        document.getElementById('bgDown').onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'toolnest-nobg.png';
            a.click();
        };
    } catch (e) {
        console.error(e);
        if (statusText) statusText.textContent = 'Error: ' + e.message;
    }
}
