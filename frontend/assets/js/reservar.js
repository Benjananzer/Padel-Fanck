document.addEventListener("DOMContentLoaded", () => {
  const daysContainer = document.getElementById("days-container");
  const slotsContainer = document.getElementById("slots-container");
  const courtTabs = document.querySelectorAll(".court-tab");
  const myTurnosList = document.getElementById("my-turnos-list");

  // Modal DOM
  const modal = document.getElementById("payment-modal");
  const modalClose = document.getElementById("modal-close");
  const modalSummaryText = document.getElementById("modal-summary-text");
  const btnConfirmPayment = document.getElementById("btn-confirm-payment");
  const modalStepPayment = document.getElementById("modal-step-payment");
  const modalStepSuccess = document.getElementById("modal-step-success");
  const successTicketInfo = document.getElementById("success-ticket-info");
  const btnSuccessClose = document.getElementById("btn-success-close");

  const payPanels = {
    "Tarjeta": document.getElementById("pay-detail-tarjeta"),
    "Mercado Pago / QR": document.getElementById("pay-detail-qr"),
    "Transferencia / Alias": document.getElementById("pay-detail-alias"),
    "Efectivo en el complejo": document.getElementById("pay-detail-efectivo")
  };

  let selectedDayIndex = 0;
  let selectedCourt = "Cancha 1";
  let selectedSlotTime = null;
  let selectedDayText = "";

  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const baseTimes = [
    "08:00 – 09:30", "09:30 – 11:00", "11:00 – 12:30",
    "12:30 – 14:00", "14:00 – 15:30", "15:30 – 17:00",
    "17:00 – 18:30", "18:30 – 20:00", "20:00 – 21:30", "21:30 – 23:00"
  ];

  const scheduleDatabase = {};
  const today = new Date();
  const daysList = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    const name = i === 0 ? "HOY" : dayNames[date.getDay()];
    const num = date.getDate();
    const fullText = `${name} ${num}`;

    daysList.push({ name, num, fullText });

    scheduleDatabase[i] = {};
    ["Cancha 1", "Cancha 2", "Cancha 3"].forEach((court, cIdx) => {
      scheduleDatabase[i][court] = baseTimes.map((time, tIdx) => ({
        time,
        occupied: (i + cIdx + tIdx) % 3 === 0
      }));
    });
  }

  selectedDayText = daysList[0].fullText;

  daysList.forEach((day, idx) => {
    const dayCard = document.createElement("div");
    dayCard.className = `day-card ${idx === 0 ? "active" : ""}`;
    dayCard.innerHTML = `
      <span class="day-name">${day.name}</span>
      <span class="day-num">${day.num}</span>
    `;

    dayCard.addEventListener("click", () => {
      document.querySelectorAll(".day-card").forEach(c => c.classList.remove("active"));
      dayCard.classList.add("active");
      selectedDayIndex = idx;
      selectedDayText = day.fullText;
      loadSlots();
    });

    daysContainer.appendChild(dayCard);
  });

  function loadSlots() {
    slotsContainer.innerHTML = "";
    const slots = scheduleDatabase[selectedDayIndex][selectedCourt];

    slots.forEach(slot => {
      const card = document.createElement("div");
      card.className = `slot-card ${slot.occupied ? "occupied" : ""}`;
      card.innerHTML = `
        <span class="slot-time">${slot.time}</span>
        <span class="slot-status">${slot.occupied ? "Ocupado" : "Disponible"}</span>
      `;

      if (!slot.occupied) {
        card.addEventListener("click", () => {
          selectedSlotTime = slot.time;
          openPaymentModal();
        });
      }

      slotsContainer.appendChild(card);
    });
  }

  courtTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      courtTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      selectedCourt = `Cancha ${tab.dataset.court}`;
      loadSlots();
    });
  });

  function openPaymentModal() {
    modalSummaryText.textContent = `${selectedCourt} — ${selectedDayText} (${selectedSlotTime})`;
    modalStepPayment.classList.remove("hidden");
    modalStepSuccess.classList.add("hidden");
    clearCardErrors();
    modal.classList.add("active");
  }

  modalClose.addEventListener("click", () => modal.classList.remove("active"));

  const payOptions = document.querySelectorAll(".payment-option");
  payOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      payOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      const selectedVal = opt.querySelector("input").value;
      opt.querySelector("input").checked = true;

      Object.values(payPanels).forEach(p => p.classList.add("hidden"));
      if (payPanels[selectedVal]) {
        payPanels[selectedVal].classList.remove("hidden");
      }
    });
  });

  const btnCopyAlias = document.getElementById("btn-copy-alias");
  if (btnCopyAlias) {
    btnCopyAlias.addEventListener("click", () => {
      navigator.clipboard.writeText("PADEL.FRANCK.MP");
      btnCopyAlias.textContent = "¡Copiado!";
      setTimeout(() => btnCopyAlias.textContent = "Copiar", 2000);
    });
  }

  // ==========================================
  // VALIDACIONES RIGUROSAS Y DINÁMICAS DE TARJETA
  // ==========================================
  function clearCardErrors() {
    const errorMsgs = payPanels["Tarjeta"].querySelectorAll(".error-msg");
    errorMsgs.forEach(el => el.remove());

    const inputs = payPanels["Tarjeta"].querySelectorAll("input");
    inputs.forEach(input => {
      input.style.borderColor = "var(--card-border)";
    });
  }

  function showError(inputElement, message) {
    inputElement.style.borderColor = "#ef4444";
    const errorSpan = document.createElement("span");
    errorSpan.className = "error-msg";
    errorSpan.style.color = "#ef4444";
    errorSpan.style.fontSize = "0.75rem";
    errorSpan.style.fontWeight = "600";
    errorSpan.style.marginTop = "0.2rem";
    errorSpan.style.display = "block";
    errorSpan.textContent = message;

    inputElement.parentNode.appendChild(errorSpan);
  }

  function validateCardForm() {
    clearCardErrors();
    const tarjetaPanel = payPanels["Tarjeta"];
    const inputs = tarjetaPanel.querySelectorAll("input");

    const cardNumberInput = inputs[0];  // Número de tarjeta
    const cardExpInput = inputs[1];     // Vencimiento MM/AA
    const cardCvcInput = inputs[2];     // CVC 3 dígitos
    const cardHolderInput = inputs[3];  // Nombre Titular

    let isValid = true;

    // 1. Validar Número de Tarjeta (16 dígitos exactos)
    const rawCardNum = cardNumberInput.value.replace(/\s+/g, '');
    if (!rawCardNum) {
      showError(cardNumberInput, "Ingresá el número de tarjeta.");
      isValid = false;
    } else if (!/^\d{16}$/.test(rawCardNum)) {
      showError(cardNumberInput, "El número de tarjeta debe tener 16 dígitos.");
      isValid = false;
    }

    // 2. Validar Vencimiento Dinámico (Formato MM/AA y posterior/igual a hoy)
    const expValue = cardExpInput.value.trim();
    const expRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;

    if (!expValue) {
      showError(cardExpInput, "Ingresá el vencimiento.");
      isValid = false;
    } else if (!expRegex.test(expValue)) {
      showError(cardExpInput, "Formato inválido. Usá MM/AA (ej: 12/26).");
      isValid = false;
    } else {
      // Comprobar que no esté vencida respecto a la fecha de HOY
      const match = expValue.match(expRegex);
      const inputMonth = parseInt(match[1], 10);
      const inputYear = parseInt("20" + match[2], 10);

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // Enero es 0
      const currentYear = now.getFullYear();

      if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
        showError(cardExpInput, "La tarjeta está vencida.");
        isValid = false;
      }
    }

    // 3. Validar CVC (3 dígitos exactos)
    const cvcValue = cardCvcInput.value.trim();
    if (!cvcValue) {
      showError(cardCvcInput, "Ingresá el CVC.");
      isValid = false;
    } else if (!/^\d{3}$/.test(cvcValue)) {
      showError(cardCvcInput, "El CVC debe tener 3 números.");
      isValid = false;
    }

    // 4. Validar Titular de la Tarjeta
    const holderValue = cardHolderInput.value.trim();
    if (!holderValue) {
      showError(cardHolderInput, "Ingresá el nombre del titular.");
      isValid = false;
    } else if (holderValue.length < 3) {
      showError(cardHolderInput, "Ingresá un nombre y apellido válido.");
      isValid = false;
    }

    return isValid;
  }

  const myReservations = [];

  btnConfirmPayment.addEventListener("click", () => {
    const selectedPayMethod = document.querySelector('input[name="payment"]:checked').value;

    // Ejecutar validación si eligió Tarjeta
    if (selectedPayMethod === "Tarjeta") {
      if (!validateCardForm()) {
        return; // Detiene la confirmación si hay errores
      }
    }

    const reservationCode = "PF-" + Math.floor(1000 + Math.random() * 9000);

    const slots = scheduleDatabase[selectedDayIndex][selectedCourt];
    const slotObj = slots.find(s => s.time === selectedSlotTime);
    if (slotObj) slotObj.occupied = true;

    myReservations.push({
      court: selectedCourt,
      day: selectedDayText,
      time: selectedSlotTime,
      payMethod: selectedPayMethod,
      price: "$15.000",
      code: reservationCode
    });

    successTicketInfo.innerHTML = `
      <p><strong>Cancha:</strong> ${selectedCourt}</p>
      <p><strong>Fecha/Hora:</strong> ${selectedDayText} (${selectedSlotTime})</p>
      <p><strong>Monto Abonado:</strong> $15.000 ARS</p>
      <p><strong>Forma de Pago:</strong> ${selectedPayMethod}</p>
      <p><strong>Código de Reserva:</strong> <span class="code">${reservationCode}</span></p>
    `;

    modalStepPayment.classList.add("hidden");
    modalStepSuccess.classList.remove("hidden");

    loadSlots();
    renderMyTurnos();
  });

  btnSuccessClose.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  function renderMyTurnos() {
    if (myReservations.length === 0) {
      myTurnosList.innerHTML = `<p class="empty-state">Todavía no tenés turnos reservados.</p>`;
      return;
    }

    myTurnosList.innerHTML = "";
    myReservations.forEach((res, index) => {
      const card = document.createElement("div");
      card.className = "turno-confirmed-card";
      card.innerHTML = `
        <div class="turno-info">
          <span class="badge-active">• TURNO CONFIRMADO</span>
          <h4>${res.court} — ${res.time}</h4>
          <p>Día: <strong>${res.day}</strong> | Valor: <strong>${res.price}</strong> | Pago: <strong>${res.payMethod}</strong> | Código: <strong class="code">${res.code}</strong></p>
        </div>
        <button class="btn-cancel" data-index="${index}">Cancelar</button>
      `;
      myTurnosList.appendChild(card);
    });

    document.querySelectorAll(".btn-cancel").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        myReservations.splice(idx, 1);
        renderMyTurnos();
      });
    });
  }

  loadSlots();
});