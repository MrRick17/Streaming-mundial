document.addEventListener('DOMContentLoaded', () => {

    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast--${tipo}`; 
        const icono = tipo === 'success' ? 'fa-circle-check' : 'fa-bell';
        toast.innerHTML = `<i class="fa-solid ${icono}"></i> ${mensaje}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast--hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const toggleModal = (modalId, show) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            if(show) modal.classList.remove('modal-oculto'); 
            else modal.classList.add('modal-oculto'); 
        }
    };

    const navItems = document.querySelectorAll('.nav-item');
    const vistas = document.querySelectorAll('.vista-seccion');

    if (navItems.length > 0 && vistas.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); 
                const destino = item.getAttribute('data-vista');
                if (!destino) return;

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                vistas.forEach(vista => vista.classList.add('vista-oculta'));
                
                const vistaAMostrar = document.getElementById(`vista-${destino}`);
                if (vistaAMostrar) vistaAMostrar.classList.remove('vista-oculta');
            });
        });
    }

    let cuentas = JSON.parse(localStorage.getItem('streaming_cuentas')) || [];
    let clientes = JSON.parse(localStorage.getItem('streaming_clientes')) || [];
    let historialPagos = JSON.parse(localStorage.getItem('streaming_historial_pagos')) || [];

    // ================== NUEVO: REGISTRAR EN EL HISTORIAL ==================
    const registrarTransaccionHistorial = (monto, plataforma, clienteId) => {
        const fechaActual = new Date();
        const mesStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
        
        historialPagos.push({
            id: Date.now(),
            clienteId: clienteId, // <-- Vinculamos el pago a este cliente
            monto: parseFloat(monto) || 0,
            plataforma: plataforma,
            fecha: fechaActual.getTime(),
            mes: mesStr
        });
        localStorage.setItem('streaming_historial_pagos', JSON.stringify(historialPagos));
    };

    const verificarVencimientosClientes = () => {
        const ahora = new Date();
        const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
        const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999).getTime();

        let actualizado = false;
        clientes.forEach(c => {
            let nuevoEstado = 'aldia';
            if (c.fechaVencimiento < hoyInicio) nuevoEstado = 'moroso';
            else if (c.fechaVencimiento >= hoyInicio && c.fechaVencimiento <= hoyFin) nuevoEstado = 'vence-hoy';

            if (c.estado !== nuevoEstado) {
                c.estado = nuevoEstado;
                actualizado = true;
            }
        });
        if (actualizado) localStorage.setItem('streaming_clientes', JSON.stringify(clientes));
    };
    
    const generarHTMLTarjetaCliente = (c) => {
        const esMoroso = c.estado === 'moroso';
        const esHoy = c.estado === 'vence-hoy';
        const iniciales = c.nombre.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

        let bgGradient = 'gradient-aldia';
        let badgeTexto = 'Al Día';
        let badgeClase = 'badge-aldia';
        let avatarColor = '#10B981';

        if (esMoroso) {
            bgGradient = 'gradient-atrasado'; badgeTexto = 'Atrasado'; badgeClase = 'badge-vencida'; avatarColor = '#EF4444';
        } else if (esHoy) {
            bgGradient = 'gradient-vence-hoy'; badgeTexto = 'Vence Hoy'; badgeClase = 'badge-vencida'; avatarColor = '#F59E0B';
        }

        let icon = 'fa-solid fa-play'; let col = '#E50914';
        if(c.servicioPlataforma === 'Spotify') { icon = 'fa-brands fa-spotify'; col = '#1DB954'; }
        if(c.servicioPlataforma === 'Max') { icon = 'fa-solid fa-tv'; col = '#002BE7'; }
        if(c.servicioPlataforma === 'Disney+') { icon = 'fa-solid fa-star'; col = '#113CCF'; }
        if(c.servicioPlataforma === 'Crunchyroll') { icon = 'fa-solid fa-fire'; col = '#F47521'; }
        if(c.servicioPlataforma === 'YouTube Premium') { icon = 'fa-brands fa-youtube'; col = '#FF0000'; }
        if(c.servicioPlataforma === 'Canva') { icon = 'fa-solid fa-palette'; col = '#7D2AE8'; }
        if(c.servicioPlataforma === 'CapCut') { icon = 'fa-solid fa-video'; col = '#00F2FE'; }

        let fechaTexto = 'Sin Fecha';
        if (c.fechaVencimiento) {
            const f = new Date(c.fechaVencimiento);
            fechaTexto = `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
        }

        return `
            <div class="cliente-card ${bgGradient}">
                <div class="cliente-card__header" style="border-bottom-color: rgba(0,0,0,0.05);">
                    <div class="cliente-meta">
                        <div class="cliente-avatar" style="background-color: ${avatarColor};">${iniciales}</div>
                        <div>
                            <h3>${c.nombre}</h3>
                            <span class="badge ${badgeClase}" ${esHoy ? 'style="background: rgba(245,158,11,0.2); color: #F59E0B;"' : ''}>${badgeTexto}</span>
                        </div>
                    </div>
                    <button class="btn-icon-sub" onclick="eliminarCliente(${c.id})" title="Borrar" type="button"><i class="fa-solid fa-trash" style="color: #9CA3AF;"></i></button>
                </div>
                <div class="cliente-servicios">
                    <h4>Servicios Contratados:</h4>
                    <div class="servicio-linea">
                        <i class="${icon}" style="color: ${col};"></i>
                        <div class="servicio-detalles">
                            <p class="serv-nom">${c.servicioPlataforma} (${c.servicioDetalle}) - <strong style="color: #10B981;">$${parseFloat(c.montoPago || 0).toFixed(2)}</strong></p>
                            <p class="serv-mail" style="margin-bottom: 4px;">${c.servicioCorreo}</p>
                            <p class="serv-mail" style="font-weight: 700;">
                                <i class="fa-regular fa-calendar" style="color: ${esMoroso ? '#EF4444' : '#6B7280'}; font-size: 0.8rem; margin-right: 3px;"></i> 
                                Vence: <span style="color: ${esMoroso ? '#EF4444' : '#1F2937'};">${fechaTexto}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="cliente-card__actions">
                    <button class="btn-accion-cliente" onclick="abrirModalCliente(${c.id})" type="button"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                    ${(esMoroso || esHoy) 
                        ? `<button class="btn-accion-cliente" style="color: #EF4444; border-color: #EF4444;" onclick="abrirModalPago(${c.id})" type="button"><i class="fa-solid fa-bell"></i> Cobrar</button>
                           <button class="btn-accion-cliente" style="color: #25D366; border-color: rgba(37,211,102,0.3);" onclick="enviarRecordatorio(${c.id})" type="button" title="Enviar recordatorio"><i class="fa-brands fa-whatsapp"></i> ${c.estadoAviso === 'avisado' ? 'Reenviar' : 'Avisar'}</button>`
                        : `<button class="btn-accion-cliente" style="color: #10B981;" onclick="abrirModalPago(${c.id})" type="button"><i class="fa-solid fa-receipt"></i> Renovar</button>`
                    }
                </div>
            </div>
        `;
    };

    const actualizarDashboard = () => {
        verificarVencimientosClientes();

        const kpiMadres = document.getElementById('kpi-madres');
        const kpiAldia = document.getElementById('kpi-aldia');
        const kpiMora = document.getElementById('kpi-mora');
        const kpiIngresos = document.getElementById('kpi-ingresos');

        const totalCuentas = cuentas.length;
        const totalAldia = clientes.filter(c => c.estado === 'aldia').length;
        const totalMorosos = clientes.filter(c => c.estado === 'moroso' || c.estado === 'vence-hoy').length; 
        const totalEsperado = clientes.reduce((acc, c) => acc + (parseFloat(c.montoPago) || 0), 0);

        if (kpiMadres) kpiMadres.textContent = totalCuentas;
        if (kpiAldia) kpiAldia.textContent = totalAldia;
        if (kpiMora) kpiMora.textContent = totalMorosos;
        if (kpiIngresos) kpiIngresos.textContent = `$${totalEsperado.toFixed(2)}`;

        renderizarDashboardServicios();
        renderizarReportesFinancieros(totalEsperado);
        
        const contVenceHoy = document.getElementById('contenedor-vence-hoy');
        const sectionVenceHoy = document.getElementById('section-vence-hoy');
        if (contVenceHoy && sectionVenceHoy) {
            const vencenHoy = clientes.filter(c => c.estado === 'vence-hoy');
            if (vencenHoy.length > 0) {
                sectionVenceHoy.classList.remove('vista-oculta');
                contVenceHoy.innerHTML = vencenHoy.map(c => generarHTMLTarjetaCliente(c)).join('');
            } else {
                sectionVenceHoy.classList.add('vista-oculta');
                contVenceHoy.innerHTML = '';
            }
        }
    };

    const renderizarReportesFinancieros = (totalEsperado) => {
        const totalCobrado = clientes.filter(c => c.estado === 'aldia').reduce((acc, c) => acc + (parseFloat(c.montoPago) || 0), 0);
        const totalPendiente = totalEsperado - totalCobrado;

        const repEsperado = document.getElementById('rep-esperado');
        const repCobrado = document.getElementById('rep-cobrado');
        const repPendiente = document.getElementById('rep-pendiente');

        if(repEsperado) repEsperado.textContent = `$${totalEsperado.toFixed(2)}`;
        if(repCobrado) repCobrado.textContent = `$${totalCobrado.toFixed(2)}`;
        if(repPendiente) repPendiente.textContent = `$${totalPendiente.toFixed(2)}`;

        // RENDERIZAR HISTORIAL DE MESES
        const contHistorial = document.getElementById('contenedor-historial-meses');
        if (contHistorial) {
            const agrupadoMeses = historialPagos.reduce((acc, pago) => {
                if (!acc[pago.mes]) acc[pago.mes] = 0;
                acc[pago.mes] += pago.monto;
                return acc;
            }, {});

            const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const mesesOrdenados = Object.keys(agrupadoMeses).sort((a, b) => b.localeCompare(a)); 

            let htmlHistorial = '';
            mesesOrdenados.forEach(mes => {
                const [year, month] = mes.split('-');
                const nombreMes = nombresMeses[parseInt(month) - 1];
                htmlHistorial += `
                    <div class="plat-card" style="display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #10B981;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 12px; color: #10B981; font-size: 1.2rem;">
                                <i class="fa-solid fa-calendar-check"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.05rem; color: #1F2937;">${nombreMes} ${year}</h3>
                                <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #6B7280;">Monto recaudado este mes</p>
                            </div>
                        </div>
                        <h2 style="margin: 0; color: #10B981; font-size: 1.3rem;">$${agrupadoMeses[mes].toFixed(2)}</h2>
                    </div>
                `;
            });

            if (htmlHistorial === '') htmlHistorial = `<p style="grid-column: 1/-1; text-align: center; color: #9CA3AF; padding: 25px;">No hay ingresos registrados en el historial mensual aún.</p>`;
            contHistorial.innerHTML = htmlHistorial;
        }

        // RENDERIZAR DESGLOSE DE PLATAFORMAS
        const contReportesPlat = document.getElementById('contenedor-reporte-plataformas');
        if (contReportesPlat) {
            contReportesPlat.innerHTML = '';
            const plataformas = [
                { nombre: 'Netflix', color: '#E50914', icono: 'fa-solid fa-play' },
                { nombre: 'Max', color: '#002BE7', icono: 'fa-solid fa-tv' },
                { nombre: 'Spotify', color: '#1DB954', icono: 'fa-brands fa-spotify' },
                { nombre: 'Disney+', color: '#113CCF', icono: 'fa-solid fa-star' },
                { nombre: 'Crunchyroll', color: '#F47521', icono: 'fa-solid fa-fire' },
                { nombre: 'YouTube Premium', color: '#FF0000', icono: 'fa-brands fa-youtube' },
                { nombre: 'Canva', color: '#7D2AE8', icono: 'fa-solid fa-palette' },
                { nombre: 'CapCut', color: '#00F2FE', icono: 'fa-solid fa-video' }
            ];

            let htmlPlat = '';
            plataformas.forEach(plat => {
                const clientesPlat = clientes.filter(c => c.servicioPlataforma === plat.nombre);
                if (clientesPlat.length === 0) return; 

                const platEsperado = clientesPlat.reduce((acc, c) => acc + (parseFloat(c.montoPago) || 0), 0);
                const platCobrado = clientesPlat.filter(c => c.estado === 'aldia').reduce((acc, c) => acc + (parseFloat(c.montoPago) || 0), 0);
                const porcentaje = platEsperado === 0 ? 0 : Math.round((platCobrado / platEsperado) * 100);

                htmlPlat += `
                    <div class="plat-card" style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="${plat.icono}" style="color: ${plat.color}; font-size: 1.5rem;"></i>
                            <h3 style="margin: 0; font-size: 1.1rem; color: #1F2937;">${plat.nombre}</h3>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.9rem;">
                            <span style="color: #6B7280;">Cobrado: <strong style="color: #10B981;">$${platCobrado.toFixed(2)}</strong></span>
                            <span style="color: #6B7280;">Total: <strong style="color: #1F2937;">$${platEsperado.toFixed(2)}</strong></span>
                        </div>
                        <div class="progress-bg">
                            <div class="progress-bar" style="width: ${porcentaje}%; background-color: ${plat.color};"></div>
                        </div>
                        <span style="font-size: 0.75rem; text-align: right; color: #9CA3AF; font-weight: 700;">${porcentaje}% Recaudado</span>
                    </div>
                `;
            });

            if (htmlPlat === '') htmlPlat = `<p style="grid-column: 1/-1; text-align: center; color: #9CA3AF; padding: 25px;">No hay ingresos activos registrados.</p>`;
            contReportesPlat.innerHTML = htmlPlat;
        }
    };

    const contenedorPlataformas = document.getElementById('contenedor-plataformas');
    const renderizarDashboardServicios = () => {
        if (!contenedorPlataformas) return;
        contenedorPlataformas.innerHTML = '';

        const serviciosDef = [
            { nombre: 'Netflix', color: '#E50914', icono: 'fa-solid fa-play' },
            { nombre: 'Max', color: '#002BE7', icono: 'fa-solid fa-tv' },
            { nombre: 'Spotify', color: '#1DB954', icono: 'fa-brands fa-spotify' },
            { nombre: 'Disney+', color: '#113CCF', icono: 'fa-solid fa-star' },
            { nombre: 'Crunchyroll', color: '#F47521', icono: 'fa-solid fa-fire' },
            { nombre: 'YouTube Premium', color: '#FF0000', icono: 'fa-brands fa-youtube' },
            { nombre: 'Canva', color: '#7D2AE8', icono: 'fa-solid fa-palette' },
            { nombre: 'CapCut', color: '#00F2FE', icono: 'fa-solid fa-video' }
        ];

        serviciosDef.forEach(serv => {
            const madresCount = cuentas.filter(c => c.plataforma === serv.nombre).length;
            const perfilesCount = clientes.filter(c => c.servicioPlataforma === serv.nombre).length;

            const tarjeta = document.createElement('div');
            tarjeta.className = 'plat-card';
            tarjeta.innerHTML = `
                <div class="plat-card__header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="${serv.icono}" style="color: ${serv.color}; font-size: 1.5rem;"></i>
                        <h3 style="margin: 0; font-size: 1.1rem; color: #1F2937;">${serv.nombre}</h3>
                    </div>
                    <span class="plat-card__tag" style="background-color: ${serv.color}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;">Activo</span>
                </div>
                <div class="plat-card__info" style="margin-top: 12px; color: #6B7280; font-size: 0.85rem;">
                    <p style="margin: 0 0 4px 0;">Cuentas Madre: <strong style="color: #1F2937;">${madresCount}</strong></p>
                    <p style="margin: 0;">Perfiles Vendidos: <strong style="color: #1F2937;">${perfilesCount}</strong></p>
                </div>
            `;
            contenedorPlataformas.appendChild(tarjeta);
        });
    };

    const guardarYRenderizarCuentas = () => {
        localStorage.setItem('streaming_cuentas', JSON.stringify(cuentas));
        const filtroActivo = document.querySelector('#vista-cuentas .btn-filtro.active');
        const textoFiltro = filtroActivo && filtroActivo.getAttribute('data-filtro') !== 'Todas' ? filtroActivo.getAttribute('data-filtro') : '';
        renderizarCuentas(textoFiltro);
        actualizarDashboard();
    };

    const renderizarCuentas = (filtro = '') => {
        const grid = document.querySelector('.grid-cuentas');
        if (!grid) return;
        grid.innerHTML = '';

        const filtradas = cuentas.filter(c => c.correo.toLowerCase().includes(filtro.toLowerCase()) || c.plataforma.toLowerCase().includes(filtro.toLowerCase()));
        if (filtradas.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9CA3AF; padding: 25px;">No hay cuentas registradas con este filtro.</p>`;
            return;
        }

        filtradas.forEach(c => {
            let badgeHTML = c.estado === 'vencida' ? `<span class="badge badge-vencida">Vencida</span>` : 
                            c.estado === 'por-vencer' ? `<span class="badge badge-vencida" style="background-color: rgba(245, 158, 11, 0.1); color: #F59E0B;">Por Vencer</span>` : 
                            `<span class="badge badge-aldia">Al Día</span>`;

            const tarjeta = document.createElement('div');
            tarjeta.className = `cuenta-card ${c.estado === 'aldia' ? 'card-ok' : 'card-alerta'}`;
            tarjeta.innerHTML = `
                <div class="plat-card__header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div class="plat-meta" style="display: flex; align-items: center; gap: 10px;">
                        <i class="${c.icono}" style="color: ${c.color}; font-size: 1.4rem;"></i>
                        <h3 style="margin: 0; font-size: 1.1rem; color: #1F2937;">${c.plataforma}</h3>
                    </div>
                    ${badgeHTML}
                </div>
                <div class="plat-card__info" style="color: #4B5563; font-size: 0.88rem; display: flex; flex-direction: column; gap: 6px;">
                    <p style="margin: 0;">Correo: <strong style="color: #1F2937;">${c.correo}</strong></p>
                    <p style="margin: 0;">Perfiles Ocupados: <strong style="color: #1F2937;">${c.perfilesOcupados || 0} / ${c.perfilesMax}</strong></p>
                </div>
                <div class="plat-card__actions" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #F3F4F6; padding-top: 15px;">
                    <button class="btn-accion primary" type="button" onclick="abrirModalSubcuentas(${c.id})" style="background-color: rgba(59, 130, 246, 0.1); color: #3B82F6; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer;">Gestionar Perfiles</button>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-icon-sub" type="button" onclick="abrirModalEditarCuenta(${c.id})" title="Editar Correo"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon-sub delete-icon" type="button" onclick="abrirModalEliminar(${c.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            grid.appendChild(tarjeta);
        });
    };

    const inputBuscadorCuentas = document.getElementById('buscador-cuentas');
    const botonesFiltroCuentas = document.querySelectorAll('#vista-cuentas .btn-filtro');
    if (inputBuscadorCuentas) {
        inputBuscadorCuentas.addEventListener('input', (e) => {
            renderizarCuentas(e.target.value);
            botonesFiltroCuentas.forEach(b => b.classList.remove('active'));
        });
    }

    botonesFiltroCuentas.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltroCuentas.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');
            if (inputBuscadorCuentas) inputBuscadorCuentas.value = '';
            const filtroVal = boton.getAttribute('data-filtro');
            renderizarCuentas(filtroVal === 'Todas' ? '' : filtroVal);
        });
    });

    const modalAgregarId = 'modal-agregar-cuenta';
    const formAgregarCuenta = document.getElementById('form-agregar-cuenta');
    document.getElementById('btn-agregar-cuenta')?.addEventListener('click', () => toggleModal(modalAgregarId, true));
    document.getElementById('cerrar-modal-agregar')?.addEventListener('click', () => toggleModal(modalAgregarId, false));
    
    if (formAgregarCuenta) {
        formAgregarCuenta.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputCorreoObj = document.getElementById('nuevo-correo');
            const correoGuardado = inputCorreoObj ? inputCorreoObj.value.trim() : 'Sin Correo';
            const plataforma = document.getElementById('nuevo-plataforma').value;
            const perfilesMax = parseInt(document.getElementById('nuevo-perfiles').value) || 5;
            const estado = document.getElementById('nuevo-estado').value;

            let icono = 'fa-solid fa-play'; let color = '#E50914';
            if (plataforma === 'Spotify') { icono = 'fa-brands fa-spotify'; color = '#1DB954'; }
            else if (plataforma === 'Max') { icono = 'fa-solid fa-tv'; color = '#002BE7'; }
            else if (plataforma === 'Disney+') { icono = 'fa-solid fa-star'; color = '#113CCF'; }
            else if (plataforma === 'Crunchyroll') { icono = 'fa-solid fa-fire'; color = '#F47521'; }
            else if (plataforma === 'YouTube Premium') { icono = 'fa-brands fa-youtube'; color = '#FF0000'; }
            else if (plataforma === 'Canva') { icono = 'fa-solid fa-palette'; color = '#7D2AE8'; }
            else if (plataforma === 'CapCut') { icono = 'fa-solid fa-video'; color = '#00F2FE'; }

            const subcuentasIniciales = [];
            for (let i = 0; i < perfilesMax; i++) subcuentasIniciales.push({ nombre: '', correoPerfil: '' });

            const nuevaCuenta = {
                id: Date.now(), plataforma: plataforma, icono: icono, color: color,
                correo: correoGuardado, perfilesMax: perfilesMax, perfilesOcupados: 0,
                estado: estado, subcuentas: subcuentasIniciales
            };

            cuentas.push(nuevaCuenta);
            guardarYRenderizarCuentas();
            toggleModal(modalAgregarId, false);
            formAgregarCuenta.reset();
            mostrarNotificacion('¡Cuenta Madre guardada con éxito!');
        });
    }

    let cuentaAEliminar = null;
    const modalEliminarId = 'modal-eliminar';
    window.abrirModalEliminar = function(id) { cuentaAEliminar = id; toggleModal(modalEliminarId, true); };
    document.getElementById('btn-cancelar-eliminar')?.addEventListener('click', () => { toggleModal(modalEliminarId, false); cuentaAEliminar = null; });
    document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', () => {
        if (cuentaAEliminar) {
            cuentas = cuentas.filter(c => c.id !== cuentaAEliminar);
            guardarYRenderizarCuentas();
            toggleModal(modalEliminarId, false);
            mostrarNotificacion('Cuenta eliminada', 'info');
        }
    });

    let cuentaEnEdicionId = null;
    const modalSubId = 'modal-subcuentas';
    document.getElementById('cerrar-modal-sub')?.addEventListener('click', () => toggleModal(modalSubId, false));

    window.abrirModalSubcuentas = function(idCuenta) {
        const cuenta = cuentas.find(c => c.id === idCuenta);
        if (!cuenta) return;
        cuentaEnEdicionId = cuenta.id;
        toggleModal(modalSubId, true);
        const correoRef = document.getElementById('modal-correo-ref');
        if (correoRef) correoRef.textContent = `${cuenta.plataforma} — ${cuenta.correo}`;

        if (!cuenta.subcuentas || cuenta.subcuentas.length !== cuenta.perfilesMax) {
            cuenta.subcuentas = [];
            for (let i = 1; i <= cuenta.perfilesMax; i++) cuenta.subcuentas.push({ nombre: '', correoPerfil: '' });
        }

        const contenedorListaPerfiles = document.getElementById('contenedor-lista-perfiles');
        if (contenedorListaPerfiles) {
            contenedorListaPerfiles.innerHTML = '';
            cuenta.subcuentas.forEach((sub, index) => {
                const perfilDiv = document.createElement('div');
                perfilDiv.className = 'perfil-item-box';
                perfilDiv.style.cssText = 'background: #F9FAFB; padding: 12px; border-radius: 12px; border: 1px solid #E5E7EB; display: flex; flex-direction: column; gap: 8px;';
                
                perfilDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; font-size: 0.85rem; color: #374151;">Perfil ${index + 1}</span>
                        <span style="font-size: 0.75rem; color: #9CA3AF;">Slot ${index + 1} de ${cuenta.perfilesMax}</span>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <input type="text" class="input-nombre-perfil" placeholder="Nombre del cliente" value="${sub.nombre || ''}" style="flex: 1; min-width: 140px; padding: 8px; border-radius: 8px; border: 1px solid #D1D5DB; font-size: 0.85rem; color: #1F2937; outline: none;">
                        <input type="text" class="input-correo-perfil" placeholder="Correo o PIN" value="${sub.correoPerfil || ''}" style="flex: 1; min-width: 140px; padding: 8px; border-radius: 8px; border: 1px solid #D1D5DB; font-size: 0.85rem; color: #1F2937; outline: none;">
                    </div>
                `;
                contenedorListaPerfiles.appendChild(perfilDiv);
            });
        }
    };

    document.getElementById('btn-guardar-cambios-subcuentas')?.addEventListener('click', () => {
        if (!cuentaEnEdicionId) return;
        const cuenta = cuentas.find(c => c.id === cuentaEnEdicionId);
        if (!cuenta) return;

        const contenedorListaPerfiles = document.getElementById('contenedor-lista-perfiles');
        const itemsPerfiles = contenedorListaPerfiles.querySelectorAll('.perfil-item-box');
        let ocupadosCount = 0;

        cuenta.subcuentas = [];
        itemsPerfiles.forEach(item => {
            const cajaNombre = item.querySelector('.input-nombre-perfil');
            const cajaCorreo = item.querySelector('.input-correo-perfil');
            const nombreGuardado = cajaNombre ? cajaNombre.value.trim() : '';
            const correoPerfilGuardado = cajaCorreo ? cajaCorreo.value.trim() : '';
            
            cuenta.subcuentas.push({ nombre: nombreGuardado, correoPerfil: correoPerfilGuardado });
            if (nombreGuardado !== '') ocupadosCount++;
        });

        cuenta.perfilesOcupados = ocupadosCount;
        guardarYRenderizarCuentas();
        toggleModal(modalSubId, false);
        mostrarNotificacion('Perfiles actualizados', 'success');
    });

    const guardarYRenderizarClientes = () => {
        localStorage.setItem('streaming_clientes', JSON.stringify(clientes));
        const filtroActivo = document.querySelector('#vista-clientes .btn-filtro.active');
        const filtroVal = filtroActivo ? filtroActivo.getAttribute('data-filtro') : 'todos';
        renderizarClientes(filtroVal);
        actualizarDashboard();
    };

    const renderizarClientes = (filtroEstado = 'todos') => {
        verificarVencimientosClientes();
        const grid = document.querySelector('#vista-clientes .grid-clientes'); 
        if (!grid) return;
        
        const textoBusqueda = (document.getElementById('buscador-clientes')?.value || '').toLowerCase();
        
        let filtrados = clientes.filter(c => {
            const coincideBusqueda = c.nombre.toLowerCase().includes(textoBusqueda) || c.servicioCorreo.toLowerCase().includes(textoBusqueda);
            const coincideEstado = filtroEstado === 'todos' || 
                                  (filtroEstado === 'aldia' && c.estado === 'aldia') || 
                                  (filtroEstado === 'vencidos' && (c.estado === 'moroso' || c.estado === 'vence-hoy'));
            return coincideBusqueda && coincideEstado;
        });

        if (filtrados.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9CA3AF; padding: 25px;">No se encontraron clientes registrados.</p>`;
            return;
        }
        
        grid.innerHTML = filtrados.map(c => generarHTMLTarjetaCliente(c)).join('');
    };

    const inputBuscadorClientes = document.getElementById('buscador-clientes');
    const botonesFiltroClientes = document.querySelectorAll('#vista-clientes .btn-filtro');
    if (inputBuscadorClientes) {
        inputBuscadorClientes.addEventListener('input', () => {
            const activo = document.querySelector('#vista-clientes .btn-filtro.active');
            renderizarClientes(activo ? activo.getAttribute('data-filtro') : 'todos');
        });
    }
    botonesFiltroClientes.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltroClientes.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');
            if(inputBuscadorClientes) inputBuscadorClientes.value = '';
            renderizarClientes(boton.getAttribute('data-filtro'));
        });
    });

    const modalClienteId = 'modal-cliente';
    const selectPlataforma = document.getElementById('cliente-plataforma');
    const grupoCorreoPersonal = document.getElementById('grupo-correo-personal');
    const inputContrasena = document.getElementById('cliente-contrasena');
    const inputCorreoBase = document.getElementById('cliente-correo');

    if(selectPlataforma) {
        selectPlataforma.addEventListener('change', (e) => {
            if(e.target.value === 'Spotify') {
                if(grupoCorreoPersonal) grupoCorreoPersonal.style.display = 'flex';
                if(inputContrasena) inputContrasena.placeholder = 'Contraseña Admin (Opcional)';
                if(inputCorreoBase) inputCorreoBase.placeholder = 'Correo Admin / Cuenta Madre';
            } else {
                if(grupoCorreoPersonal) grupoCorreoPersonal.style.display = 'none';
                if(inputContrasena) inputContrasena.placeholder = 'Contraseña o PIN del perfil';
                if(inputCorreoBase) inputCorreoBase.placeholder = 'correo.vinculado@gmail.com';
            }
        });
    }
    const formCliente = document.getElementById('form-cliente');
    
    document.getElementById('btn-agregar-cliente')?.addEventListener('click', () => {
        if(formCliente) formCliente.reset();
        document.getElementById('cliente-id').value = '';
        document.getElementById('titulo-modal-cliente').textContent = 'Agregar Cliente';
        
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 28);
        const yyyy = defaultDate.getFullYear();
        const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
        const dd = String(defaultDate.getDate()).padStart(2, '0');
        document.getElementById('cliente-fecha-vencimiento').value = `${yyyy}-${mm}-${dd}`;

        toggleModal(modalClienteId, true);
    });

    document.getElementById('cerrar-modal-cliente')?.addEventListener('click', () => toggleModal(modalClienteId, false));

    window.abrirModalCliente = function(id) {
        const cliente = clientes.find(c => c.id === id);
        if (!cliente) return;
        
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-nombre').value = cliente.nombre;
        document.getElementById('cliente-estado').value = (cliente.estado === 'moroso' || cliente.estado === 'vence-hoy') ? 'moroso' : 'aldia';
        document.getElementById('cliente-monto').value = cliente.montoPago || '';
        document.getElementById('cliente-plataforma').value = cliente.servicioPlataforma;
        document.getElementById('cliente-detalle').value = cliente.servicioDetalle;
        document.getElementById('cliente-correo').value = cliente.servicioCorreo;
        
        document.getElementById('cliente-telefono').value = cliente.telefono || '';
        document.getElementById('cliente-metodo-pago').value = cliente.metodoPago || 'Binance';
        document.getElementById('cliente-contrasena').value = cliente.contrasena || '';

        const inputPersonal = document.getElementById('cliente-correo-personal');
        if(inputPersonal) inputPersonal.value = cliente.correoPersonal || '';
        document.getElementById('cliente-plataforma').dispatchEvent(new Event('change'));
        
        if (cliente.fechaVencimiento) {
            const fd = new Date(cliente.fechaVencimiento);
            const yyyy = fd.getFullYear();
            const mm = String(fd.getMonth() + 1).padStart(2, '0');
            const dd = String(fd.getDate()).padStart(2, '0');
            document.getElementById('cliente-fecha-vencimiento').value = `${yyyy}-${mm}-${dd}`;
        }

        document.getElementById('titulo-modal-cliente').textContent = 'Editar Cliente';
        toggleModal(modalClienteId, true);
    };

    if (formCliente) {
        formCliente.addEventListener('submit', (e) => {
            e.preventDefault();
            const idForm = document.getElementById('cliente-id').value;
            const fechaInput = document.getElementById('cliente-fecha-vencimiento').value;
            const [year, month, day] = fechaInput.split('-');
            const fechaManual = new Date(year, month - 1, day, 23, 59, 59).getTime();

            const telefono = document.getElementById('cliente-telefono').value.replace(/\D/g, ''); 
            const metodoPago = document.getElementById('cliente-metodo-pago').value;
            const contrasena = document.getElementById('cliente-contrasena').value.trim();

            const inputPersonal = document.getElementById('cliente-correo-personal');
            const correoPersonal = inputPersonal && inputPersonal.parentElement.style.display !== 'none' ? inputPersonal.value.trim() : '';

            const datosCliente = {
                id: idForm ? parseInt(idForm) : Date.now(),
                nombre: document.getElementById('cliente-nombre').value.trim(),
                estado: 'aldia', 
                montoPago: parseFloat(document.getElementById('cliente-monto').value) || 0,
                servicioPlataforma: document.getElementById('cliente-plataforma').value,
                servicioDetalle: document.getElementById('cliente-detalle').value.trim(),
                servicioCorreo: document.getElementById('cliente-correo').value.trim(),
                correoPersonal: correoPersonal, // Se guarda el correo personal
                fechaVencimiento: fechaManual,
                telefono: telefono,
                metodoPago: metodoPago,
                contrasena: contrasena,
                estadoAviso: idForm ? (clientes.find(c => c.id === parseInt(idForm))?.estadoAviso || 'pendiente') : 'pendiente'
            };

            if (idForm) {
                const index = clientes.findIndex(c => c.id === parseInt(idForm));
                if(index > -1) { clientes[index] = datosCliente; }
                
                // NUEVO: Si editaste un cliente, corregir su monto y plataforma en el historial
                historialPagos.forEach(pago => {
                    if (pago.clienteId === parseInt(idForm)) {
                        pago.monto = datosCliente.montoPago;
                        pago.plataforma = datosCliente.servicioPlataforma;
                    }
                });
                localStorage.setItem('streaming_historial_pagos', JSON.stringify(historialPagos));

            } else {
                clientes.push(datosCliente);
                // NUEVO: Enviamos el ID al crear un cliente
                registrarTransaccionHistorial(datosCliente.montoPago, datosCliente.servicioPlataforma, datosCliente.id);
            }

            guardarYRenderizarClientes();
            toggleModal(modalClienteId, false);
            mostrarNotificacion('¡Cliente guardado! Abriendo WhatsApp...', 'success');

            const fechaFormateada = new Date(fechaManual).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            let mensajeWa = '';

            // Construcción del mensaje con acentos y emojis blindados (Unicode)
            if (datosCliente.servicioPlataforma === 'Spotify') {
                // Mensaje Especial Spotify
                mensajeWa = `\u00A1Hola ${datosCliente.nombre}! \uD83D\uDC4B\n\nAqu\u00ED tienes los detalles de tu cuenta de *Spotify*:\n\n\uD83D\uDCE7 *Tu Correo (Invitaci\u00F3n):* ${datosCliente.correoPersonal}\n\uD83C\uDFB5 *Plan:* ${datosCliente.servicioDetalle}\n\n\uD83D\uDDD3\uFE0F *Tu cuenta vence el:* ${fechaFormateada}\n\n\u00A1Gracias por tu compra! Disfruta tu m\u00FAsica. \uD83C\uDFA7`;
            } else {
                // Mensaje General (Netflix, Max, Disney, etc)
                mensajeWa = `\u00A1Hola ${datosCliente.nombre}! \uD83D\uDC4B\n\nAqu\u00ED tienes los datos de acceso de tu cuenta de *${datosCliente.servicioPlataforma}*:\n\n\uD83D\uDCE7 *Correo:* ${datosCliente.servicioCorreo}\n\uD83D\uDD11 *Contrase\u00F1a/PIN:* ${datosCliente.contrasena}\n\uD83D\uDCFA *Perfil Asignado:* ${datosCliente.servicioDetalle}\n\n\uD83D\uDDD3\uFE0F *Tu cuenta vence el:* ${fechaFormateada}\n\n\u00A1Gracias por tu compra! Disfruta tu contenido. \uD83C\uDF7F`;
            }
            
           const urlWa = `https://api.whatsapp.com/send?phone=${datosCliente.telefono}&text=${encodeURIComponent(mensajeWa)}`;
            window.open(urlWa, '_blank');
        });
    }

    let clienteAEliminarId = null;
    const modalEliminarClienteId = 'modal-eliminar-cliente';
    window.eliminarCliente = function(id) { clienteAEliminarId = id; toggleModal(modalEliminarClienteId, true); };
    document.getElementById('btn-cancelar-eliminar-cliente')?.addEventListener('click', () => { toggleModal(modalEliminarClienteId, false); clienteAEliminarId = null; });
    document.getElementById('btn-confirmar-eliminar-cliente')?.addEventListener('click', () => {
        if (clienteAEliminarId !== null) {
            clientes = clientes.filter(c => c.id !== clienteAEliminarId);
            
            // NUEVO: Borrar también sus pagos del historial
            historialPagos = historialPagos.filter(pago => pago.clienteId !== clienteAEliminarId);
            localStorage.setItem('streaming_historial_pagos', JSON.stringify(historialPagos));

            guardarYRenderizarClientes();
            toggleModal(modalEliminarClienteId, false);
            clienteAEliminarId = null;
            mostrarNotificacion('Cliente eliminado', 'info');
        }
    });

    let clientePagoId = null;
    const modalPagoId = 'modal-pago';
    window.abrirModalPago = function(id) { clientePagoId = id; toggleModal(modalPagoId, true); };
    document.getElementById('btn-cancelar-pago')?.addEventListener('click', () => { toggleModal(modalPagoId, false); clientePagoId = null; });

    document.getElementById('btn-confirmar-pago')?.addEventListener('click', () => {
        if(clientePagoId) {
            const index = clientes.findIndex(c => c.id === clientePagoId);
            if(index > -1) {
                let baseDate = new Date();
                if (clientes[index].fechaVencimiento > Date.now()) baseDate = new Date(clientes[index].fechaVencimiento);
                baseDate.setDate(baseDate.getDate() + 28);
                
                clientes[index].estado = 'aldia';
                clientes[index].fechaVencimiento = baseDate.setHours(23, 59, 59, 999);
                
                // ES UNA RENOVACIÓN. Registramos el pago en el historial
                registrarTransaccionHistorial(clientes[index].montoPago, clientes[index].servicioPlataforma, clientes[index].id);
                
                guardarYRenderizarClientes();
            }
            toggleModal(modalPagoId, false);
            clientePagoId = null;
            mostrarNotificacion('¡Pago registrado con éxito en el historial!');
        }
    });

    window.enviarRecordatorio = function(id) {
        const index = clientes.findIndex(c => c.id === id);
        if (index > -1) {
            const c = clientes[index];
            const estaMoroso = c.estado === 'moroso';
            const mensaje = `¡Hola ${c.nombre}! 👋\n\nTe escribimos de *Streaming Mundial* para recordarte que tu suscripción de *${c.servicioPlataforma}* ${estaMoroso ? 'ha vencido' : 'vence el día de hoy'}.\n\nPuedes renovar tu servicio realizando el pago de *$${parseFloat(c.montoPago).toFixed(2)}* vía *${c.metodoPago || 'tu método habitual'}*.\n\n¡Quedamos atentos!`;
            
            clientes[index].estadoAviso = 'avisado';
            guardarYRenderizarClientes();
            
            const urlWa = `https://wa.me/${c.telefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(urlWa, '_blank');
            mostrarNotificacion('Recordatorio enviado', 'info');
        }
    };

    const modalEditarCuentaId = 'modal-editar-cuenta';
    const formEditarCuenta = document.getElementById('form-editar-cuenta');
    document.getElementById('cerrar-modal-editar-cuenta')?.addEventListener('click', () => toggleModal(modalEditarCuentaId, false));

    window.abrirModalEditarCuenta = function(id) {
        const cuenta = cuentas.find(c => c.id === id);
        if (!cuenta) return;
        document.getElementById('edit-cuenta-id').value = cuenta.id;
        document.getElementById('edit-cuenta-correo').value = cuenta.correo;
        toggleModal(modalEditarCuentaId, true);
    };

    const modalNotificacionId = 'modal-notificacion-masiva';
    document.getElementById('cerrar-modal-notificacion')?.addEventListener('click', () => toggleModal(modalNotificacionId, false));

    if (formEditarCuenta) {
        formEditarCuenta.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('edit-cuenta-id').value);
            const nuevoCorreo = document.getElementById('edit-cuenta-correo').value.trim();
            const cuenta = cuentas.find(c => c.id === id);
            if (!cuenta) return;

            const correoViejo = cuenta.correo;
            cuenta.correo = nuevoCorreo;
            guardarYRenderizarCuentas(); 

            const clientesAfectados = clientes.filter(c => c.servicioCorreo.toLowerCase() === correoViejo.toLowerCase() && c.servicioPlataforma === cuenta.plataforma);
            
            if (clientesAfectados.length > 0) {
                clientesAfectados.forEach(c => c.servicioCorreo = nuevoCorreo);
                guardarYRenderizarClientes();
                toggleModal(modalEditarCuentaId, false);
                abrirModalNotificacionMasiva(clientesAfectados, cuenta.plataforma, nuevoCorreo);
            } else {
                toggleModal(modalEditarCuentaId, false);
                mostrarNotificacion('Correo actualizado. No hay clientes vinculados a este correo.', 'success');
            }
        });
    }

    window.abrirModalNotificacionMasiva = function(clientesAfectados, plataforma, nuevoCorreo) {
        const contenedor = document.getElementById('lista-clientes-notificar');
        contenedor.innerHTML = '';
        
        clientesAfectados.forEach(c => {
            const mensaje = `¡Hola ${c.nombre}! 👋\n\nTe informamos que por motivos de mantenimiento hemos actualizado el correo de acceso para tu cuenta de *${plataforma}*.\n\n📧 *Nuevo Correo:* ${nuevoCorreo}\n🔑 *Contraseña/PIN:* ${c.contrasena || 'La misma que ya tenías'}\n📺 *Perfil:* ${c.servicioDetalle}\n\nPor favor, utiliza este nuevo correo para iniciar sesión a partir de ahora. ¡Gracias por tu comprensión!`;
            const urlWa = `https://wa.me/${c.telefono}?text=${encodeURIComponent(mensaje)}`;
            
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #F9FAFB; padding: 12px; border-radius: 10px; border: 1px solid #E5E7EB;';
            item.innerHTML = `
                <div>
                    <strong style="color: #1F2937; display: block; font-size: 0.9rem;">${c.nombre}</strong>
                    <span style="color: #6B7280; font-size: 0.8rem;">Perfil: ${c.servicioDetalle}</span>
                </div>
                <a href="${urlWa}" target="_blank" onclick="this.style.backgroundColor='#E5E7EB'; this.style.color='#9CA3AF'; this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Listo';" style="background: #25D366; color: white; padding: 8px 12px; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: 0.2s;">
                    <i class="fa-brands fa-whatsapp"></i> Notificar
                </a>
            `;
            contenedor.appendChild(item);
        });
        toggleModal(modalNotificacionId, true);
    };

    actualizarDashboard();
    renderizarCuentas();
    renderizarClientes('todos');
});