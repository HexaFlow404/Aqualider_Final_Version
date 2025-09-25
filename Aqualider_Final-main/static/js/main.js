document.addEventListener('DOMContentLoaded', () => {

    // --- Botones de marcador de posición ---
    const tutorialBtn = document.getElementById('tutorialBtn');
    const statsBtn = document.getElementById('statsBtn');

    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            alert('La función de Tutorial aún no está implementada.');
        });
    }

    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            alert('La función de Estadísticas aún no está implementada.');
        });
    }


    // --- Controles de sonido y música ---
    const musicBtn = document.getElementById('music-btn');
    const soundBtn = document.getElementById('sound-btn');
    let isMusicOn = true;
    let isSoundOn = true;

    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            isMusicOn = !isMusicOn;
            musicBtn.textContent = isMusicOn ? '🎵' : '🔇';
        });
    }

    if(soundBtn) {
        soundBtn.addEventListener('click', () => {
            isSoundOn = !isSoundOn;
            soundBtn.textContent = isSoundOn ? '🔊' : '🔈';
        });
    }


    // --- Menú de Ayuda ---
    const helpBtn = document.getElementById('help-btn');
    const helpMenu = document.getElementById('help-menu');
    const closeHelpBtn = document.getElementById('close-help-btn');

    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpMenu.classList.toggle('hidden');
        });
    }
    
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            helpMenu.classList.add('hidden');
        });
    }
    
    // Cierra el menú de ayuda
    document.addEventListener('click', (e) => {
        if (helpMenu && !helpMenu.classList.contains('hidden') && !helpMenu.contains(e.target) && e.target !== helpBtn) {
            helpMenu.classList.add('hidden');
        }
    });

});