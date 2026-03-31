document.addEventListener("DOMContentLoaded", function () {
    // Funcionalidad para estrellas de calificación
    const stars = document.querySelectorAll(".star-rating input");

    stars.forEach(star => {
        star.addEventListener("click", function () {
            let selected = this.value;
            console.log("Calificación seleccionada:", selected);

            // Actualizar visualización de estrellas seleccionadas
            stars.forEach(otherStar => {
                otherStar.checked = false;
            });
            this.checked = true;
        });
    });

    // Funcionalidad para ajustar cantidades
    const productos = document.querySelectorAll(".producto");

    productos.forEach(producto => {
        const botones = producto.querySelectorAll(".btn-cantidad");
        const cantidadSpan = producto.querySelector(".acciones span");

        if (botones.length === 2) {
            // Funcionalidad del botón "menos"
            botones[0].addEventListener("click", function () {
                let cantidad = parseInt(cantidadSpan.textContent);
                if (cantidad > 1) { 
                    cantidad--;
                    cantidadSpan.textContent = cantidad;
                }
            });

            // Funcionalidad del botón "más"
            botones[1].addEventListener("click", function () {
                let cantidad = parseInt(cantidadSpan.textContent);
                cantidad++;
                cantidadSpan.textContent = cantidad;
            });
        }
    });

    // Funcionalidad para redirigir al pago
    const pagoBtn = document.querySelector(".btn-pago");
    console.log("Botón de pago detectado:", pagoBtn); // Debug

    if (pagoBtn) {
        pagoBtn.addEventListener("click", function () {
            console.log("Redirigiendo a /payment");
            window.location.href = "/payment"; 
        });
    }
});


document.querySelector('form').addEventListener('submit', function (e) {
    const password = document.querySelector('input[name="password"]').value;
    const confirm = document.querySelector('input[name="confirm_password"]').value;

    // Expresión regular: 8-12 caracteres, al menos una letra, un número y un símbolo
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,12}$/;

    if (!regex.test(password)) {
        e.preventDefault();
        alert('La contraseña debe tener entre 8 y 12 caracteres, incluyendo al menos una letra, un número y un símbolo especial.');
        return;
    }

    if (password !== confirm) {
        e.preventDefault();
        alert('Las contraseñas no coinciden.');
        return;
    }
});
