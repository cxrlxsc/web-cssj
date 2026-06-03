export const Contact = () => {
  return (
    <section className="seccion seccion-gris">
      <div className="grid-3" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-azul" style={{ margin: '0 auto 1.5rem' }}>📍</div>
          <h3 className="titulo-tarjeta">Ubicación</h3>
          <p className="texto-tarjeta">Santa Tecla, La Libertad<br/>El Salvador, C.A.</p>
        </div>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-verde" style={{ margin: '0 auto 1.5rem' }}>📞</div>
          <h3 className="titulo-tarjeta">Teléfono</h3>
          <p className="texto-tarjeta">+503 2222-2222<br/>+503 2222-2223</p>
        </div>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-amarillo" style={{ margin: '0 auto 1.5rem' }}>✉️</div>
          <h3 className="titulo-tarjeta">Correo</h3>
          <p className="texto-tarjeta">info@salesianosanjose.edu.sv<br/>admisiones@salesianosanjose.edu.sv</p>
        </div>
      </div>
    </section>
  );
};