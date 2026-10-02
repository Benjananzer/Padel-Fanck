document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-torneos");

  const torneos = [
    { nombre: "Torneo Abierto 5ta Categoría", fecha: "15 de Noviembre" },
    { nombre: "Torneo Relámpago Mixto", fecha: "28 de Noviembre" }
  ];

  if (lista) {
    lista.innerHTML = torneos.map(t => `
      <div style="margin-top: 1rem; border-left: 3px solid #10b981; padding-left: 0.5rem;">
        <h3>${t.nombre}</h3>
        <p><strong>Fecha:</strong> ${t.fecha}</p>
      </div>
    `).join("");
  }
});