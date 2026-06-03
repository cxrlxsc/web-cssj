// src/components/home/Values.tsx

export const Values = () => {
  return (
    <section id="valores">
      {/* Encabezado Oscuro */}
      <div className="seccion-identidad-header">
        <span className="sup-titulo-identidad">Identidad Institucional</span>
        <h2 className="titulo-identidad">PRINCIPIOS Y VALORES SALESIANOS</h2>
        <p className="texto-identidad-intro">
          El <strong>Colegio Salesiano San José</strong> forma jóvenes íntegros, con profunda vocación humana y cristiana, que les impulse a servir con honestidad y alegría a la sociedad y a sus semejantes.
        </p>
      </div>

      {/* Contenedor de las Tarjetas Alternadas */}
      <div className="seccion-identidad-contenido">
        
        {/* Bloque 1: Texto Izquierda, Imagen Derecha */}
        <div className="bloque-alterno">
          <div className="bloque-texto">
            <p>
              Los <strong>principios</strong> que rigen al Colegio Salesiano San José se fundamentan en el Sistema Preventivo de San Juan Bosco: la primacía de la <strong>Razón, la Religión y la Amabilidad</strong>, orientados a la consecución de la verdad, el bien común y el desarrollo integral del alumno.
            </p>
          </div>
          <div className="bloque-imagen">
            <img 
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop" 
              alt="Estudiantes compartiendo en grupo" 
            />
          </div>
        </div>

        {/* Bloque 2: Imagen Izquierda, Texto Derecha (Usando bloque-reverso) */}
        <div className="bloque-alterno bloque-reverso">
          <div className="bloque-texto">
            <p>
              Entre los <strong>valores</strong> que rigen el accionar y la convivencia de nuestra comunidad educativa están:
            </p>
            <ul className="lista-valores">
              <li><span>1.</span> Fe y Espiritualidad</li>
              <li><span>2.</span> Alegría y Optimismo</li>
              <li><span>3.</span> Responsabilidad</li>
              <li><span>4.</span> Honestidad</li>
              <li><span>5.</span> Solidaridad</li>
              <li><span>6.</span> Espíritu de Familia</li>
            </ul>
          </div>
          <div className="bloque-imagen">
            <img 
              src="https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=1000&auto=format&fit=crop" 
              alt="Comunidad educativa salesiana" 
            />
          </div>
        </div>

      </div>
    </section>
  );
};