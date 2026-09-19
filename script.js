document.getElementById("year").textContent = new Date().getFullYear();

const cards = document.querySelectorAll(".project-card");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

cards.forEach((card) => {
  card.style.opacity = "0";
  card.style.transform = "translateY(18px)";
  card.style.transition = "opacity 0.6s ease, transform 0.6s ease, border-color 0.25s ease";
  observer.observe(card);
});
