# Argentine Prediction Markets - Raw Data

## Market List for Implementation

| Question | Category | Resolution Date | Image | Outcomes |
|----------|----------|----------------|-------|----------|
| ¿Renunciará Marcelo Gallardo como entrenador de River Plate en 2025? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Habrá otro swap entre Estados Unidos y Argentina durante 2025? | Politics | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Lanzará Bizarrap una sesión con un artista argentino durante 2025? | Culture | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Cuál será la inflación mensual de Argentina en noviembre de 2025? | Economy | 2025-12-01 00:00:00 | null | ["Scalar"] |
| ¿Se reunirá Milei con Xi Jinping durante 2025? | Politics | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Se reunirá Milei con el Papa durante 2025? | Politics | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Subirá el Merval en noviembre de 2025? | Economy | 2025-11-30 00:00:00 | null | ["Yes","No"] |
| ¿Liberará el BCRA las bandas cambiarias durante 2025? | Economy | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Renunciará Milei antes de terminar su mandato presidencial? | Politics | 2027-12-10 00:00:00 | null | ["Yes","No"] |
| ¿Subirá el tipo de cambio oficial del USD en noviembre de 2025? | Economy | 2025-11-30 00:00:00 | null | ["Yes","No"] |
| ¿Se cerrará o disolverá el Banco Central (BCRA) durante el gobierno de Milei? | Politics | 2027-12-10 00:00:00 | null | ["Yes","No"] |
| ¿Convocarán a Paulo Dybala al Mundial 2026? | Sports | 2026-06-10 00:00:00 | null | ["Yes","No"] |
| ¿Correrá Franco Colapinto para Alpine en la temporada 2026 de F1? | Sports | 2026-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Convocarán a Nicolás Otamendi a la Selección Argentina para el Mundial 2026? | Sports | 2026-06-10 00:00:00 | null | ["Yes","No"] |
| ¿Ganará algún equipo argentino la Copa Libertadores 2025? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Firmará Messi con Newell's Old Boys antes de retirarse? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Logrará Franco Colapinto un podio en 2025? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Cuántos tuits publicará Javier Milei en noviembre de 2025? | Politics | 2025-11-30 00:00:00 | null | ["Scalar"] |
| ¿Jugará Lionel Messi el Mundial 2026? | Sports | 2026-06-10 00:00:00 | null | ["Yes","No"] |
| ¿Renunciará Riquelme antes de que termine su presidencia? | Sports | 2027-12-10 00:00:00 | null | ["Yes","No"] |
| ¿Firmará Argentina un nuevo préstamo con el FMI en 2025? | Politics | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Convocarán a Franco Mastantuono al Mundial 2026? | Sports | 2026-06-10 00:00:00 | null | ["Yes","No"] |
| ¿Clasificará Boca Juniors a la Copa Libertadores 2026? | Sports | 2026-02-10 00:00:00 | null | ["Yes","No"] |
| ¿Superará el tipo de cambio oficial del USD los $2.000 ARS durante 2025? | Economy | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Qué sucede primero: el tipo de cambio oficial supera los $2.000 o baja de $1.000? | Economy | 2026-12-31 00:00:00 | null | ["Over $2","000","under $1","000"] |
| ¿Ganará Argentina la Copa Mundial FIFA 2026? | Sports | 2026-07-16 00:00:00 | null | ["Yes","No"] |
| ¿Abandonará Argentina el Mercosur durante el primer gobierno de Milei? | Politics | 2027-12-10 00:00:00 | null | ["Yes","No"] |
| ¿Implementará Argentina la dolarización durante 2025? | Economy | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Lanzará Havanna un nuevo sabor de alfajor durante 2025? | Culture | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Superará la inflación mensual de Argentina el 3% en noviembre de 2025? | Economy | 2025-11-30 00:00:00 | null | ["Yes","No"] |
| ¿Ganará algún equipo argentino la Copa Sudamericana 2025? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Anunciará Di María su retiro final en 2025? | Sports | 2025-12-31 00:00:00 | null | ["Yes","No"] |
| ¿Juega Lionel Messi en el Mundial 2026? | Deportes | 2026-07-19 00:00:00 | null | ["Sí","No"] |
| ¿Subirá el riesgo país de Argentina en noviembre de 2025? | Economy | 2025-12-01 00:00:00 | null | ["Yes","No"] |

## Notes

- Total markets: 34
- Categories: Sports, Politics, Culture, Economy, Deportes
- Most markets are binary (Yes/No)
- Some scalar markets for numeric predictions
- Resolution dates range from 2025-11-30 to 2027-12-10
- All questions are in Spanish
- Need to create detailed resolution criteria for each market following delphAI best practices

## Next Steps

1. Select 10 most relevant markets for initial deployment
2. Create detailed resolution criteria with:
   - Specific data sources and API endpoints
   - Precise resolution times with buffers
   - Explicit resolution logic
   - Edge case handling
3. Generate Foundry script to deploy markets
4. Fund with liquidity and execute test trades
