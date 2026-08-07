

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. SISTEMA DE NAVEGACIÓN (SPA)
    // ==========================================
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

                vistas.forEach(vista => vista.style.display = 'none');
                const vistaAMostrar = document.getElementById(`vista-${destino}`);
                if (vistaAMostrar) vistaAMostrar.style.display = 'block';
            });
        });
    }

    // ==========================================
    // 2. BACKEND / MEMORIA PERSISTENTE (CERO REAL)
    // ==========================================
    // Arranca completamente vacío, sin objetos quemados para simular una instalación limpia.
    let cuentas = JSON.parse(localStorage.getItem('streaming_cuentas')) || [];
    let clientes = JSON.parse(localStorage.getItem('streaming_clientes')) || [];

    // Verificación automática de expiraciones (30 días de ciclo)
    const verificarVencimientosClientes = () => {
        const ahora = Date.now();
        let actualizado = false;
        clientes.forEach(c => {
            if (c.estado === 'aldia' && c.fechaVencimiento && ahora > c.fechaVencimiento) {
                c.estado = 'moroso';
                actualizado = true;
            }
        });
        if (actualizado) {
            localStorage.setItem('streaming_clientes', JSON.stringify(clientes));
        }
    };
    verificarVencimientosClientes();

    // ==========================================
    // 3. DASHBOARD Y CONTADORES 100% DINÁMICOS
    // ==========================================
    const actualizarDashboard = () => {
        verificarVencimientosClientes();

        const kpiMadres = document.getElementById('kpi-madres');
        const kpiAldia = document.getElementById('kpi-aldia');
        const kpiMora = document.getElementById('kpi-mora');
        const kpiIngresos = document.getElementById('kpi-ingresos');

        const totalCuentas = cuentas.length;
        const totalAldia = clientes.filter(c => c.estado === 'aldia').length;
        const totalMorosos = clientes.filter(c => c.estado === 'moroso').length;
        const totalIngresos = clientes.reduce((acc, c) => acc + (parseFloat(c.montoPago) || 0), 0);

        // Renderizado dinámico de KPIs principales
        if (kpiMadres) kpiMadres.textContent = totalCuentas;
        if (kpiAldia) kpiAldia.textContent = totalAldia;
        if (kpiMora) kpiMora.textContent = totalMorosos;
        if (kpiIngresos) kpiIngresos.textContent = `$${totalIngresos.toFixed(2)}`;

        renderizarDashboardServicios();
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

    // ==========================================
    // 4. MÓDULO: CUENTAS MADRE (CRUD)
    // ==========================================
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
                    <button class="btn-accion" type="button" onclick="abrirModalEliminar(${c.id})" style="background: none; border: none; color: #EF4444; cursor: pointer; padding: 6px; font-size: 1rem;" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
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

    const modalAgregar = document.getElementById('modal-agregar-cuenta');
    const btnAbrirModalAgregar = document.getElementById('btn-agregar-cuenta');
    const btnCerrarModalAgregar = document.getElementById('cerrar-modal-agregar');
    const formAgregarCuenta = document.getElementById('form-agregar-cuenta');

    if (btnAbrirModalAgregar && modalAgregar) btnAbrirModalAgregar.addEventListener('click', () => modalAgregar.style.display = 'flex');
    if (btnCerrarModalAgregar && modalAgregar) btnCerrarModalAgregar.addEventListener('click', () => modalAgregar.style.display = 'none');
    
    if (formAgregarCuenta) {
        formAgregarCuenta.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputCorreoObj = document.getElementById('nuevo-correo');
            const correoGuardado = inputCorreoObj ? inputCorreoObj.value.trim() : 'Sin Correo';
            const plataforma = document.getElementById('nuevo-plataforma').value;
            const perfilesMax = parseInt(document.getElementById('nuevo-perfiles').value) || 5;
            const estado = document.getElementById('nuevo-estado').value;

            let icono = 'fa-solid fa-play';
            let color = '#E50914';
            if (plataforma === 'Spotify') { icono = 'fa-brands fa-spotify'; color = '#1DB954'; }
            else if (plataforma === 'Max') { icono = 'fa-solid fa-tv'; color = '#002BE7'; }
            else if (plataforma === 'Disney+') { icono = 'fa-solid fa-star'; color = '#113CCF'; }
            else if (plataforma === 'Crunchyroll') { icono = 'fa-solid fa-fire'; color = '#F47521'; }
            else if (plataforma === 'YouTube Premium') { icono = 'fa-brands fa-youtube'; color = '#FF0000'; }
            else if (plataforma === 'Canva') { icono = 'fa-solid fa-palette'; color = '#7D2AE8'; }
            else if (plataforma === 'CapCut') { icono = 'fa-solid fa-video'; color = '#00F2FE'; }

            const subcuentasIniciales = [];
            for (let i = 0; i < perfilesMax; i++) {
                subcuentasIniciales.push({ nombre: '', correoPerfil: '' });
            }

            const nuevaCuenta = {
                id: Date.now(),
                plataforma: plataforma,
                icono: icono,
                color: color,
                correo: correoGuardado,
                perfilesMax: perfilesMax,
                perfilesOcupados: 0,
                estado: estado,
                subcuentas: subcuentasIniciales
            };

            cuentas.push(nuevaCuenta);
            guardarYRenderizarCuentas();
            modalAgregar.style.display = 'none';
            formAgregarCuenta.reset();
        });
    }

    let cuentaAEliminar = null;
    const modalEliminar = document.getElementById('modal-eliminar');
    window.abrirModalEliminar = function(id) { cuentaAEliminar = id; if (modalEliminar) modalEliminar.style.display = 'flex'; };
    document.getElementById('btn-cancelar-eliminar')?.addEventListener('click', () => { if(modalEliminar) modalEliminar.style.display = 'none'; cuentaAEliminar = null; });
    document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', () => {
        if (cuentaAEliminar) {
            cuentas = cuentas.filter(c => c.id !== cuentaAEliminar);
            guardarYRenderizarCuentas();
            if(modalEliminar) modalEliminar.style.display = 'none';
        }
    });

    // ==========================================
    // 5. GESTIÓN DE PERFILES / SUBCUENTAS
    // ==========================================
    let cuentaEnEdicionId = null;
    const modalSubcuentas = document.getElementById('modal-subcuentas');
    const btnCerrarModalSub = document.getElementById('cerrar-modal-sub');
    const contenedorListaPerfiles = document.getElementById('contenedor-lista-perfiles');
    const btnGuardarSubcuentas = document.getElementById('btn-guardar-cambios-subcuentas');

    if (btnCerrarModalSub && modalSubcuentas) btnCerrarModalSub.addEventListener('click', () => modalSubcuentas.style.display = 'none');

    window.abrirModalSubcuentas = function(idCuenta) {
        const cuenta = cuentas.find(c => c.id === idCuenta);
        if (!cuenta) return;

        cuentaEnEdicionId = cuenta.id;
        if (modalSubcuentas) modalSubcuentas.style.display = 'flex';

        const correoRef = document.getElementById('modal-correo-ref');
        if (correoRef) correoRef.textContent = `${cuenta.plataforma} — ${cuenta.correo}`;

        if (!cuenta.subcuentas || cuenta.subcuentas.length !== cuenta.perfilesMax) {
            cuenta.subcuentas = [];
            for (let i = 1; i <= cuenta.perfilesMax; i++) {
                cuenta.subcuentas.push({ nombre: '', correoPerfil: '' });
            }
        }

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

    if (btnGuardarSubcuentas) {
        btnGuardarSubcuentas.addEventListener('click', () => {
            if (!cuentaEnEdicionId) return;
            const cuenta = cuentas.find(c => c.id === cuentaEnEdicionId);
            if (!cuenta) return;

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
            if (modalSubcuentas) modalSubcuentas.style.display = 'none';
        });
    }

    // ==========================================
    // 6. MÓDULO: SECCIÓN CLIENTES (CRUD & PAGOS)
    // ==========================================
    const guardarYRenderizarClientes = () => {
        localStorage.setItem('streaming_clientes', JSON.stringify(clientes));
        const filtroActivo = document.querySelector('#vista-clientes .btn-filtro.active');
        const filtroVal = filtroActivo ? filtroActivo.getAttribute('data-filtro') : 'todos';
        renderizarClientes(filtroVal);
        actualizarDashboard();
    };

    const renderizarClientes = (filtroEstado = 'todos') => {
        verificarVencimientosClientes();
        const grid = document.querySelector('.grid-clientes');
        if (!grid) return;
        grid.innerHTML = '';

        const textoBusqueda = (document.getElementById('buscador-clientes')?.value || '').toLowerCase();
        
        let filtrados = clientes.filter(c => {
            const coincideBusqueda = c.nombre.toLowerCase().includes(textoBusqueda) || c.servicioCorreo.toLowerCase().includes(textoBusqueda);
            const coincideEstado = filtroEstado === 'todos' || 
                                  (filtroEstado === 'aldia' && c.estado === 'aldia') || 
                                  (filtroEstado === 'vencidos' && c.estado === 'moroso');
            return coincideBusqueda && coincideEstado;
        });

        if (filtrados.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9CA3AF; padding: 25px;">No se encontraron clientes registrados.</p>`;
            return;
        }

        filtrados.forEach(c => {
            const esMoroso = c.estado === 'moroso';
            const iniciales = c.nombre.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

            let icon = 'fa-solid fa-play'; let col = '#E50914';
            if(c.servicioPlataforma === 'Spotify') { icon = 'fa-brands fa-spotify'; col = '#1DB954'; }
            if(c.servicioPlataforma === 'Max') { icon = 'fa-solid fa-tv'; col = '#002BE7'; }
            if(c.servicioPlataforma === 'Disney+') { icon = 'fa-solid fa-star'; col = '#113CCF'; }
            if(c.servicioPlataforma === 'Crunchyroll') { icon = 'fa-solid fa-fire'; col = '#F47521'; }
            if(c.servicioPlataforma === 'YouTube Premium') { icon = 'fa-brands fa-youtube'; col = '#FF0000'; }
            if(c.servicioPlataforma === 'Canva') { icon = 'fa-solid fa-palette'; col = '#7D2AE8'; }
            if(c.servicioPlataforma === 'CapCut') { icon = 'fa-solid fa-video'; col = '#00F2FE'; }

            const tarjeta = document.createElement('div');
            tarjeta.className = `cliente-card ${esMoroso ? 'card-alerta' : 'card-ok'}`;
            tarjeta.innerHTML = `
                <div class="cliente-card__header">
                    <div class="cliente-meta">
                        <div class="cliente-avatar" style="background-color: ${esMoroso ? '#EF4444' : '#3B82F6'};">${iniciales}</div>
                        <div>
                            <h3>${c.nombre}</h3>
                            <span class="badge ${esMoroso ? 'badge-vencida' : 'badge-aldia'}">${esMoroso ? 'Vencido' : 'Al Día'}</span>
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
                            <p class="serv-mail">${c.servicioCorreo}</p>
                        </div>
                    </div>
                </div>
                <div class="cliente-card__actions">
                    <button class="btn-accion-cliente" onclick="abrirModalCliente(${c.id})" type="button"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                    ${esMoroso 
                        ? `<button class="btn-accion-cliente" style="color: #EF4444; border-color: #EF4444;" onclick="abrirModalPago(${c.id})" type="button"><i class="fa-solid fa-bell"></i> Cobrar / Pago</button>`
                        : `<button class="btn-accion-cliente" style="color: #10B981;" onclick="abrirModalPago(${c.id})" type="button"><i class="fa-solid fa-receipt"></i> Renovar</button>`
                    }
                </div>
            `;
            grid.appendChild(tarjeta);
        });
    };

    // Filtros e inputs de Clientes
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

    // Formulario de Cliente
    const modalCliente = document.getElementById('modal-cliente');
    const formCliente = document.getElementById('form-cliente');
    const btnCerrarCliente = document.getElementById('cerrar-modal-cliente');
    
    document.getElementById('btn-agregar-cliente')?.addEventListener('click', () => {
        if(formCliente) formCliente.reset();
        document.getElementById('cliente-id').value = '';
        document.getElementById('titulo-modal-cliente').textContent = 'Agregar Cliente';
        if (modalCliente) modalCliente.style.display = 'flex';
    });

    if (btnCerrarCliente && modalCliente) {
        btnCerrarCliente.addEventListener('click', () => {
            modalCliente.style.display = 'none';
        });
    }

    window.abrirModalCliente = function(id) {
        const cliente = clientes.find(c => c.id === id);
        if (!cliente) return;
        
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-nombre').value = cliente.nombre;
        document.getElementById('cliente-estado').value = cliente.estado === 'moroso' ? 'moroso' : 'aldia';
        document.getElementById('cliente-monto').value = cliente.montoPago || '';
        document.getElementById('cliente-plataforma').value = cliente.servicioPlataforma;
        document.getElementById('cliente-detalle').value = cliente.servicioDetalle;
        document.getElementById('cliente-correo').value = cliente.servicioCorreo;
        
        document.getElementById('titulo-modal-cliente').textContent = 'Editar Cliente';
        if (modalCliente) modalCliente.style.display = 'flex';
    };

    if (formCliente) {
        formCliente.addEventListener('submit', (e) => {
            e.preventDefault();
            const idForm = document.getElementById('cliente-id').value;
            const estadoElegido = document.getElementById('cliente-estado').value;
            
            const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;
            const fechaVenc = estadoElegido === 'aldia' ? (Date.now() + treintaDiasMs) : (Date.now() - 1000);

            const datosCliente = {
                id: idForm ? parseInt(idForm) : Date.now(),
                nombre: document.getElementById('cliente-nombre').value.trim(),
                estado: estadoElegido,
                montoPago: parseFloat(document.getElementById('cliente-monto').value) || 0,
                servicioPlataforma: document.getElementById('cliente-plataforma').value,
                servicioDetalle: document.getElementById('cliente-detalle').value.trim(),
                servicioCorreo: document.getElementById('cliente-correo').value.trim(),
                fechaVencimiento: fechaVenc
            };

            if (idForm) {
                const index = clientes.findIndex(c => c.id === parseInt(idForm));
                if(index > -1) {
                    if(clientes[index].estado === datosCliente.estado && clientes[index].fechaVencimiento) {
                        datosCliente.fechaVencimiento = clientes[index].fechaVencimiento;
                    }
                    clientes[index] = datosCliente;
                }
            } else {
                clientes.push(datosCliente);
            }

            guardarYRenderizarClientes();
            if (modalCliente) modalCliente.style.display = 'none';
        });
    }

    // Modal Custom: Eliminar Cliente
    let clienteAEliminarId = null;
    const modalEliminarCliente = document.getElementById('modal-eliminar-cliente');

    window.eliminarCliente = function(id) {
        clienteAEliminarId = id;
        if (modalEliminarCliente) {
            modalEliminarCliente.style.display = 'flex';
        }
    };

    document.getElementById('btn-cancelar-eliminar-cliente')?.addEventListener('click', () => {
        if (modalEliminarCliente) modalEliminarCliente.style.display = 'none';
        clienteAEliminarId = null;
    });

    document.getElementById('btn-confirmar-eliminar-cliente')?.addEventListener('click', () => {
        if (clienteAEliminarId !== null) {
            clientes = clientes.filter(c => c.id !== clienteAEliminarId);
            guardarYRenderizarClientes();
            if (modalEliminarCliente) modalEliminarCliente.style.display = 'none';
            clienteAEliminarId = null;
        }
    });

    // Renovaciones de Pago
    let clientePagoId = null;
    const modalPago = document.getElementById('modal-pago');
    
    window.abrirModalPago = function(id) {
        clientePagoId = id;
        if(modalPago) modalPago.style.display = 'flex';
    };

    document.getElementById('btn-cancelar-pago')?.addEventListener('click', () => {
        if(modalPago) modalPago.style.display = 'none';
        clientePagoId = null;
    });

    document.getElementById('btn-confirmar-pago')?.addEventListener('click', () => {
        if(clientePagoId) {
            const index = clientes.findIndex(c => c.id === clientePagoId);
            if(index > -1) {
                const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;
                clientes[index].estado = 'aldia';
                clientes[index].fechaVencimiento = Date.now() + treintaDiasMs;
                guardarYRenderizarClientes();
            }
            if(modalPago) modalPago.style.display = 'none';
            clientePagoId = null;
        }
    });

    // Inicializar app limpia
    actualizarDashboard();
    renderizarCuentas();
    renderizarClientes('todos');
});