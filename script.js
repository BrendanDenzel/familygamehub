function goToGame(path) {
  window.location.href = path;
}

// Optional: subtle entrance animation
window.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.game-card');

  cards.forEach((card, index) => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';

    setTimeout(() => {
      card.style.transition = 'all 0.6s ease';
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    }, 150 * index);
  });
});
