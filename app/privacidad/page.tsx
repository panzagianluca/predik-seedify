import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Predik',
  description: 'Política de privacidad preliminar de la plataforma Predik',
}

export default function PrivacidadPage() {
  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidad Preliminar de Predik</h1>
          <p className="text-muted-foreground mb-4">
            Última actualización: 11 de octubre de 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Predik (&quot;nosotros,&quot; &quot;nuestro&quot;) valora la privacidad y la protección de los datos personales de quienes utilizan nuestra plataforma. Predik funciona como una interfaz frontend y muestra mercados alojados y gestionados por la{' '}
              <a 
                href="https://myriad.markets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Fundación Myriad
              </a>
              {' '}(&quot;Myriad&quot;), en la cadena de bloques{' '}
              <a 
                href="https://celo.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Celo
              </a>
              {' '}(&quot;Celo Chain&quot;). Todas las transacciones se realizan exclusivamente a través del protocolo de Myriad.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Aunque Predik no está formalmente constituida en la Unión Europea, esta Política de Privacidad adopta buenas prácticas internacionales para el manejo responsable y seguro de datos.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Controlador de Datos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Actualmente, Predik no está constituida como entidad legal formal, pero es responsable del tratamiento de ciertos datos personales relacionados con la interacción de los usuarios en nuestra plataforma, como comentarios y datos de cookies. La{' '}
              <a 
                href="https://myriad.markets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Fundación Myriad
              </a>
              {' '}es responsable del tratamiento de datos asociados a las transacciones y mercados alojados.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para consultas sobre la protección de datos relacionadas con Myriad, puede contactar a:{' '}
              <a 
                href="mailto:support@myriad.markets" 
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                support@myriad.markets
              </a>
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Datos Recopilados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Predik recopila y trata los siguientes datos:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Información que los usuarios proporcionan directamente en la plataforma, como comentarios, perfiles de usuario o cualquier otro dato que se registre en Predik.</li>
              <li>Datos técnicos y de navegación mediante cookies, que incluyen datos de sesión, preferencias de usuario y patrones de uso.</li>
              <li>No recopilamos información sensible ni datos financieros; todas las operaciones financieras y de activos digitales se gestionan a través del protocolo de Myriad.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Uso de los Datos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Los datos recopilados por Predik se utilizan para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Gestionar y mostrar la participación del usuario en la plataforma, incluyendo comentarios y perfiles asociados.</li>
              <li>Mejorar la experiencia y personalización del Servicio.</li>
              <li>Analizar el tráfico, uso y funcionamiento mediante datos anónimos por medio de cookies y tecnologías similares.</li>
              <li>Cumplir con posibles obligaciones legales y regulatorias.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Facilitar la navegación y seguridad del sitio.</li>
              <li>Recordar preferencias y configuraciones del usuario.</li>
              <li>Recopilar datos estadísticos anónimos para análisis y mejoras del Servicio.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              El usuario puede administrar o desactivar las cookies desde la configuración de su navegador, pero hacerlo puede afectar la experiencia en la plataforma.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Divulgación y Compartición de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik no comparte datos personales con terceros salvo en casos estrictamente necesarios para el cumplimiento legal o para mejorar el Servicio. Los datos relacionados con las transacciones son gestionados exclusivamente por{' '}
              <a 
                href="https://myriad.markets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Myriad
              </a>
              {' '}de acuerdo con sus políticas.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Seguridad de los Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se adoptan medidas técnicas y organizativas razonables para proteger su información contra accesos no autorizados, alteraciones, divulgación o destrucción.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Derechos del Usuario</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Aunque Predik es aún preliminar y sin entidad legal formal, se promueve el respeto por sus derechos a:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Acceder y modificar datos que haya proporcionado en la plataforma.</li>
              <li>Solicitar la eliminación o bloqueo de datos personales, en la medida que corresponda.</li>
              <li>Retirar el consentimiento para el uso de cookies cuando sea aplicable.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Menores de Edad</h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio no está dirigido a menores de 18 años y no se recoge información de forma consciente de menores.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cambios en la Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik podrá modificar esta Política de Privacidad en cualquier momento, notificando los cambios mediante publicación en el sitio web. El uso continuado del Servicio implica aceptación de las modificaciones.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Referencias a Políticas de Terceros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política se complementa y debe leerse junto con la Política de Privacidad y{' '}
              <a 
                href="https://help.myriad.markets/Myriad-Terms-and-Conditions-234c9e49da8280749056d50fa31ae850" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Términos de Uso de la Fundación Myriad
              </a>
              , accesibles en su sitio oficial. Todas las transacciones y datos relacionados con mercados y activos digitales son regulados principalmente por Myriad.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos en:{' '}
              <a 
                href="mailto:support@predik.io" 
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                support@predik.io
              </a>
            </p>
          </section>

          {/* Notice */}
          <section className="border-t pt-6 mt-8">
            <p className="text-muted-foreground leading-relaxed font-semibold">
              Nota: Esta Política de Privacidad es preliminar y podrá ser adaptada conforme Predik avance hacia su formalización legal o cambien los modelos de datos y operaciones.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
