
const typingText = document.getElementById('typing-text');
const username = '@0x1B284004';
let charIndex = 0;
function typeWriter() {
    if (charIndex < username.length) {
        typingText.textContent += username.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 100);
    }
}
window.addEventListener('load', () => {
    setTimeout(typeWriter, 500);
});
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
let isPlaying = false;

musicToggle.addEventListener('click', () => {
    if (isPlaying) {
        bgMusic.pause();
        musicIcon.textContent = 'X';
        isPlaying = false;
    } else {
        bgMusic.play();
        musicIcon.textContent = 'O';
        isPlaying = true;
    }
});