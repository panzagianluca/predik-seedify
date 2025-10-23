import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio | Predik',
  description: 'Términos de servicio preliminares de la plataforma Predik',
}

export default function TerminosPage() {
  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Términos de Servicio Preliminares de Predik</h1>
          <p className="text-muted-foreground mb-4">
            Última actualización: 11 de octubre de 2025
          </p>
          <p className="text-lg font-semibold text-foreground">
            POR FAVOR LEA ESTOS TÉRMINOS DETENIDAMENTE ANTES DE UTILIZAR PREDIK
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Predik (&quot;nosotros,&quot; &quot;nos&quot; o &quot;nuestro&quot;) funciona como una interfaz frontend que muestra mercados y contratos alojados y gestionados por{' '}
              <a 
                href="https://myriad.markets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Myriad Foundation
              </a>
              {' '}(la &quot;Fundación Myriad&quot;), la cual opera en varias cadenas de bloques, incluyendo{' '}
              <a 
                href="https://celo.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Celo
              </a>
              , Arbitrum y Linea. Predik presenta únicamente los mercados alojados en la cadena Celo (Celo, Ethereum L2). Estos Términos de Servicio preliminares (&quot;Términos&quot;) regulan el uso del sitio web, aplicaciones y servicios asociados de Predik (colectivamente, el &quot;Servicio&quot;).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Al acceder o usar el Servicio, usted reconoce y acepta estos Términos, incluyendo su aceptación y cumplimiento de los{' '}
              <a 
                href="https://help.myriad.markets/Myriad-Terms-and-Conditions-234c9e49da8280749056d50fa31ae850" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Términos de Uso de la Fundación Myriad
              </a>
              {' '}(&quot;Términos de Myriad&quot;), los cuales rigen todas las operaciones backend, la ejecución de contratos y la custodia de activos digitales relacionados con los mercados mostrados en Predik. Si no está de acuerdo con estos Términos o con los Términos de Myriad, no debe utilizar el Servicio.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Rol de Predik</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik es únicamente una plataforma frontend que proporciona una interfaz de usuario para acceder a mercados y contratos alojados, ejecutados y gestionados por la{' '}
              <a 
                href="https://myriad.markets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Fundación Myriad
              </a>
              {' '}en la{' '}
              <a 
                href="https://celo.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                cadena Celo
              </a>
              . Predik no controla, garantiza ni tiene custodia sobre ningún activo digital o contrato. Todas las transacciones se realizan directamente en la plataforma de Myriad.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Aceptación de los Términos de Myriad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar Predik, usted debe aceptar y cumplir con los{' '}
              <a 
                href="https://help.myriad.markets/Myriad-Terms-and-Conditions-234c9e49da8280749056d50fa31ae850" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Términos de Uso de la Fundación Myriad
              </a>
              , incluyendo todas las políticas asociadas. Predik incorpora dichos términos por referencia, y usted acepta quedar vinculado por los acuerdos de Myriad como condición para usar el Servicio.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Elegibilidad y Cumplimiento del Usuario</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Usted declara que:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Tiene la capacidad legal y la autorización para usar este Servicio.</li>
              <li className="ml-4">
                No reside ni actúa desde jurisdicciones en las cuales el uso de los mercados de Myriad está prohibido o restringido. Estas jurisdicciones incluyen, pero no se limitan a:
                <ul className="list-circle list-inside space-y-1 ml-6 mt-2">
                  <li>Bahamas</li>
                  <li>Botswana</li>
                  <li>Islas Vírgenes Británicas</li>
                  <li>Camboya</li>
                  <li>Islas Caimán</li>
                  <li>Corea del Norte</li>
                  <li>Francia</li>
                  <li>Irán</li>
                  <li>Libia</li>
                  <li>Ontario (Canadá)</li>
                  <li>Somalia</li>
                  <li>Sudán</li>
                  <li>Siria</li>
                  <li>Singapur</li>
                  <li>Suiza</li>
                  <li>Trinidad y Tobago</li>
                  <li>Estados Unidos de América</li>
                  <li>Zimbabue</li>
                </ul>
              </li>
              <li>Cumplirá con todas las leyes aplicables, incluyendo regulaciones de sanciones y políticas contra el lavado de dinero.</li>
              <li>No usará VPN u otros métodos para evadir las restricciones geográficas o de jurisdicción.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. No Consejos Financieros ni Profesionales</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik ofrece información con fines únicamente informativos y no constituye asesoramiento financiero, legal o profesional. Se recomienda consultar con un profesional calificado antes de tomar decisiones que involucren el uso del Servicio o cualquier activo digital.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Riesgos y Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Usted comprende y acepta que:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                Los mercados y contratos a los que accede están basados en tecnología blockchain, específicamente en la{' '}
                <a 
                  href="https://celo.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground underline hover:text-electric-purple transition-colors"
                >
                  cadena Celo
                </a>
                , la cual conlleva riesgos inherentes tales como posibles fallas técnicas, cambios regulatorios y la naturaleza irreversible de las transacciones. Usted reconoce haber leído y aceptado el{' '}
                <a 
                  href="https://celo.org/user-agreement" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground underline hover:text-electric-purple transition-colors"
                >
                  Acuerdo de Usuario de Celo
                </a>
                .
              </li>
              <li>Predik no es responsable por la ejecución de transacciones, errores, interrupciones o pérdidas derivadas del uso del Servicio o de la plataforma Myriad.</li>
              <li>Predik brinda el Servicio &quot;tal cual&quot; y renuncia a cualquier garantía expresa o implícita, limitando su responsabilidad según lo permitido por la ley.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Privacidad y Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik respeta su privacidad y maneja los datos personales conforme a la legislación aplicable. El uso de datos dentro del Servicio está sujeto a la Política de Privacidad de la Fundación Myriad, así como a cualquier información adicional proporcionada por Predik.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Ley Aplicable y Resolución de Disputas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estos Términos y su uso del Servicio están sujetos a las leyes aplicables a las operaciones de Predik. Las disputas relacionadas con los mercados backend y contratos están sujetas a las cláusulas de arbitraje establecidas en los{' '}
              <a 
                href="https://help.myriad.markets/Myriad-Terms-and-Conditions-234c9e49da8280749056d50fa31ae850" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-electric-purple transition-colors"
              >
                Términos de Uso de la Fundación Myriad
              </a>
              , que contemplan arbitraje vinculante bajo las leyes de las Islas Caimán.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cambios en los Términos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Predik se reserva el derecho de modificar estos Términos en cualquier momento, notificándolo mediante la publicación en este sitio web. Las modificaciones entrarán en vigor inmediatamente después de su publicación. El uso continuo del Servicio implica la aceptación de dichos cambios.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tiene preguntas sobre estos Términos o necesita asistencia, puede contactarnos en:{' '}
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
              Aviso: Estos Términos son preliminares y tienen fines informativos. Predik aún no está constituida como entidad legal formal, por lo que estos términos pueden ser actualizados conforme a la evolución legal y operativa de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
