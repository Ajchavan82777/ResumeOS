export interface ResumeFont {
  name: string;
  value: string;       // CSS font-family value
  google?: string;     // Google Fonts family name (URL-encoded space = +)
  category: "serif" | "sans-serif" | "monospace";
}

export const RESUME_FONTS: ResumeFont[] = [
  // ── Serif ─────────────────────────────────────────────────────────────────
  { name: "Georgia (Classic)",      value: "Georgia, serif",                         category: "serif" },
  { name: "Times New Roman",        value: "'Times New Roman', serif",               category: "serif" },
  { name: "Palatino",               value: "Palatino, 'Palatino Linotype', serif",   category: "serif" },
  { name: "Lora",                   value: "'Lora', serif",                          google: "Lora",                   category: "serif" },
  { name: "Merriweather",           value: "'Merriweather', serif",                  google: "Merriweather",            category: "serif" },
  { name: "Playfair Display",       value: "'Playfair Display', serif",              google: "Playfair+Display",        category: "serif" },
  { name: "EB Garamond",            value: "'EB Garamond', serif",                   google: "EB+Garamond",             category: "serif" },
  { name: "Libre Baskerville",      value: "'Libre Baskerville', serif",             google: "Libre+Baskerville",       category: "serif" },
  { name: "Crimson Text",           value: "'Crimson Text', serif",                  google: "Crimson+Text",            category: "serif" },
  { name: "PT Serif",               value: "'PT Serif', serif",                      google: "PT+Serif",                category: "serif" },
  { name: "Arvo",                   value: "'Arvo', serif",                          google: "Arvo",                    category: "serif" },
  { name: "Bitter",                 value: "'Bitter', serif",                        google: "Bitter",                  category: "serif" },
  { name: "Cardo",                  value: "'Cardo', serif",                         google: "Cardo",                   category: "serif" },
  { name: "Domine",                 value: "'Domine', serif",                        google: "Domine",                  category: "serif" },
  { name: "Spectral",               value: "'Spectral', serif",                      google: "Spectral",                category: "serif" },
  { name: "Vollkorn",               value: "'Vollkorn', serif",                      google: "Vollkorn",                category: "serif" },
  { name: "Source Serif 4",         value: "'Source Serif 4', serif",                google: "Source+Serif+4",          category: "serif" },
  { name: "Cormorant Garamond",     value: "'Cormorant Garamond', serif",            google: "Cormorant+Garamond",      category: "serif" },
  { name: "Neuton",                 value: "'Neuton', serif",                        google: "Neuton",                  category: "serif" },
  { name: "Old Standard TT",        value: "'Old Standard TT', serif",              google: "Old+Standard+TT",         category: "serif" },
  { name: "Josefin Slab",           value: "'Josefin Slab', serif",                 google: "Josefin+Slab",            category: "serif" },
  { name: "Rokkitt",                value: "'Rokkitt', serif",                       google: "Rokkitt",                 category: "serif" },
  { name: "Zilla Slab",             value: "'Zilla Slab', serif",                   google: "Zilla+Slab",              category: "serif" },
  { name: "Gentium Plus",           value: "'Gentium Plus', serif",                  google: "Gentium+Plus",            category: "serif" },
  { name: "Inknut Antiqua",         value: "'Inknut Antiqua', serif",               google: "Inknut+Antiqua",          category: "serif" },
  { name: "Vidaloka",               value: "'Vidaloka', serif",                      google: "Vidaloka",                category: "serif" },
  { name: "Prata",                  value: "'Prata', serif",                         google: "Prata",                   category: "serif" },
  { name: "Alegreya",               value: "'Alegreya', serif",                      google: "Alegreya",                category: "serif" },
  { name: "Tinos",                  value: "'Tinos', serif",                         google: "Tinos",                   category: "serif" },
  { name: "Judson",                 value: "'Judson', serif",                        google: "Judson",                  category: "serif" },
  { name: "Fanwood Text",           value: "'Fanwood Text', serif",                  google: "Fanwood+Text",            category: "serif" },
  { name: "Heuristica",             value: "'Heuristica', serif",                    google: "Heuristica",              category: "serif" },
  { name: "Libre Caslon Text",      value: "'Libre Caslon Text', serif",             google: "Libre+Caslon+Text",       category: "serif" },
  { name: "Cambo",                  value: "'Cambo', serif",                         google: "Cambo",                   category: "serif" },
  { name: "Arapey",                 value: "'Arapey', serif",                        google: "Arapey",                  category: "serif" },
  { name: "Enriqueta",              value: "'Enriqueta', serif",                     google: "Enriqueta",               category: "serif" },
  { name: "Eczar",                  value: "'Eczar', serif",                         google: "Eczar",                   category: "serif" },
  { name: "Crete Round",            value: "'Crete Round', serif",                   google: "Crete+Round",             category: "serif" },
  { name: "Abhaya Libre",           value: "'Abhaya Libre', serif",                  google: "Abhaya+Libre",            category: "serif" },
  { name: "Adamina",                value: "'Adamina', serif",                       google: "Adamina",                 category: "serif" },
  { name: "Alike",                  value: "'Alike', serif",                         google: "Alike",                   category: "serif" },
  { name: "Andada Pro",             value: "'Andada Pro', serif",                    google: "Andada+Pro",              category: "serif" },
  { name: "Benne",                  value: "'Benne', serif",                         google: "Benne",                   category: "serif" },
  { name: "Artifika",               value: "'Artifika', serif",                      google: "Artifika",                category: "serif" },
  { name: "Oranienbaum",            value: "'Oranienbaum', serif",                   google: "Oranienbaum",             category: "serif" },
  { name: "Roboto Slab",            value: "'Roboto Slab', serif",                   google: "Roboto+Slab",             category: "serif" },
  { name: "Gilda Display",          value: "'Gilda Display', serif",                 google: "Gilda+Display",           category: "serif" },
  { name: "Lustria",                value: "'Lustria', serif",                       google: "Lustria",                 category: "serif" },
  { name: "Cinzel",                 value: "'Cinzel', serif",                        google: "Cinzel",                  category: "serif" },
  { name: "Trirong",                value: "'Trirong', serif",                       google: "Trirong",                 category: "serif" },
  { name: "Vesper Libre",           value: "'Vesper Libre', serif",                  google: "Vesper+Libre",            category: "serif" },
  { name: "Suranna",                value: "'Suranna', serif",                       google: "Suranna",                 category: "serif" },
  { name: "Noto Serif",             value: "'Noto Serif', serif",                    google: "Noto+Serif",              category: "serif" },
  { name: "Martel",                 value: "'Martel', serif",                        google: "Martel",                  category: "serif" },
  { name: "Gentium Book Plus",      value: "'Gentium Book Plus', serif",             google: "Gentium+Book+Plus",       category: "serif" },

  // ── Sans-Serif ────────────────────────────────────────────────────────────
  { name: "Arial",                  value: "Arial, sans-serif",                      category: "sans-serif" },
  { name: "Helvetica Neue",         value: "'Helvetica Neue', Helvetica, sans-serif",category: "sans-serif" },
  { name: "Calibri",                value: "Calibri, sans-serif",                    category: "sans-serif" },
  { name: "Trebuchet MS",           value: "'Trebuchet MS', sans-serif",             category: "sans-serif" },
  { name: "Inter",                  value: "'Inter', sans-serif",                    google: "Inter",                   category: "sans-serif" },
  { name: "Roboto",                 value: "'Roboto', sans-serif",                   google: "Roboto",                  category: "sans-serif" },
  { name: "Open Sans",              value: "'Open Sans', sans-serif",                google: "Open+Sans",               category: "sans-serif" },
  { name: "Lato",                   value: "'Lato', sans-serif",                     google: "Lato",                    category: "sans-serif" },
  { name: "Montserrat",             value: "'Montserrat', sans-serif",               google: "Montserrat",              category: "sans-serif" },
  { name: "Raleway",                value: "'Raleway', sans-serif",                  google: "Raleway",                 category: "sans-serif" },
  { name: "Nunito",                 value: "'Nunito', sans-serif",                   google: "Nunito",                  category: "sans-serif" },
  { name: "Source Sans 3",          value: "'Source Sans 3', sans-serif",            google: "Source+Sans+3",           category: "sans-serif" },
  { name: "Ubuntu",                 value: "'Ubuntu', sans-serif",                   google: "Ubuntu",                  category: "sans-serif" },
  { name: "Cabin",                  value: "'Cabin', sans-serif",                    google: "Cabin",                   category: "sans-serif" },
  { name: "Oxygen",                 value: "'Oxygen', sans-serif",                   google: "Oxygen",                  category: "sans-serif" },
  { name: "Quicksand",              value: "'Quicksand', sans-serif",                google: "Quicksand",               category: "sans-serif" },
  { name: "Mulish",                 value: "'Mulish', sans-serif",                   google: "Mulish",                  category: "sans-serif" },
  { name: "Titillium Web",          value: "'Titillium Web', sans-serif",            google: "Titillium+Web",           category: "sans-serif" },
  { name: "Fira Sans",              value: "'Fira Sans', sans-serif",                google: "Fira+Sans",               category: "sans-serif" },
  { name: "Karla",                  value: "'Karla', sans-serif",                    google: "Karla",                   category: "sans-serif" },
  { name: "Josefin Sans",           value: "'Josefin Sans', sans-serif",             google: "Josefin+Sans",            category: "sans-serif" },
  { name: "Asap",                   value: "'Asap', sans-serif",                     google: "Asap",                    category: "sans-serif" },
  { name: "Barlow",                 value: "'Barlow', sans-serif",                   google: "Barlow",                  category: "sans-serif" },
  { name: "Dosis",                  value: "'Dosis', sans-serif",                    google: "Dosis",                   category: "sans-serif" },
  { name: "Exo 2",                  value: "'Exo 2', sans-serif",                    google: "Exo+2",                   category: "sans-serif" },
  { name: "Hind",                   value: "'Hind', sans-serif",                     google: "Hind",                    category: "sans-serif" },
  { name: "Jost",                   value: "'Jost', sans-serif",                     google: "Jost",                    category: "sans-serif" },
  { name: "Libre Franklin",         value: "'Libre Franklin', sans-serif",           google: "Libre+Franklin",          category: "sans-serif" },
  { name: "Manrope",                value: "'Manrope', sans-serif",                  google: "Manrope",                 category: "sans-serif" },
  { name: "Noto Sans",              value: "'Noto Sans', sans-serif",                google: "Noto+Sans",               category: "sans-serif" },
  { name: "Overpass",               value: "'Overpass', sans-serif",                 google: "Overpass",                category: "sans-serif" },
  { name: "Poppins",                value: "'Poppins', sans-serif",                  google: "Poppins",                 category: "sans-serif" },
  { name: "Rubik",                  value: "'Rubik', sans-serif",                    google: "Rubik",                   category: "sans-serif" },
  { name: "Signika",                value: "'Signika', sans-serif",                  google: "Signika",                 category: "sans-serif" },
  { name: "Work Sans",              value: "'Work Sans', sans-serif",                google: "Work+Sans",               category: "sans-serif" },
  { name: "DM Sans",                value: "'DM Sans', sans-serif",                  google: "DM+Sans",                 category: "sans-serif" },
  { name: "Plus Jakarta Sans",      value: "'Plus Jakarta Sans', sans-serif",        google: "Plus+Jakarta+Sans",       category: "sans-serif" },
  { name: "Outfit",                 value: "'Outfit', sans-serif",                   google: "Outfit",                  category: "sans-serif" },
  { name: "Sora",                   value: "'Sora', sans-serif",                     google: "Sora",                    category: "sans-serif" },
  { name: "Lexend",                 value: "'Lexend', sans-serif",                   google: "Lexend",                  category: "sans-serif" },
  { name: "Nunito Sans",            value: "'Nunito Sans', sans-serif",              google: "Nunito+Sans",             category: "sans-serif" },
  { name: "Albert Sans",            value: "'Albert Sans', sans-serif",              google: "Albert+Sans",             category: "sans-serif" },
  { name: "Space Grotesk",          value: "'Space Grotesk', sans-serif",            google: "Space+Grotesk",           category: "sans-serif" },
  { name: "Urbanist",               value: "'Urbanist', sans-serif",                 google: "Urbanist",                category: "sans-serif" },
  { name: "Epilogue",               value: "'Epilogue', sans-serif",                 google: "Epilogue",                category: "sans-serif" },
  { name: "Be Vietnam Pro",         value: "'Be Vietnam Pro', sans-serif",           google: "Be+Vietnam+Pro",          category: "sans-serif" },
  { name: "Figtree",                value: "'Figtree', sans-serif",                  google: "Figtree",                 category: "sans-serif" },
  { name: "Wix Madefor Display",    value: "'Wix Madefor Display', sans-serif",      google: "Wix+Madefor+Display",     category: "sans-serif" },
  { name: "Kanit",                  value: "'Kanit', sans-serif",                    google: "Kanit",                   category: "sans-serif" },
  { name: "Varela Round",           value: "'Varela Round', sans-serif",             google: "Varela+Round",            category: "sans-serif" },
  { name: "Yantramanav",            value: "'Yantramanav', sans-serif",              google: "Yantramanav",             category: "sans-serif" },
  { name: "Catamaran",              value: "'Catamaran', sans-serif",                google: "Catamaran",               category: "sans-serif" },
  { name: "Mada",                   value: "'Mada', sans-serif",                     google: "Mada",                    category: "sans-serif" },
  { name: "Mukta",                  value: "'Mukta', sans-serif",                    google: "Mukta",                   category: "sans-serif" },
  { name: "PT Sans",                value: "'PT Sans', sans-serif",                  google: "PT+Sans",                 category: "sans-serif" },
  { name: "Heebo",                  value: "'Heebo', sans-serif",                    google: "Heebo",                   category: "sans-serif" },
  { name: "Questrial",              value: "'Questrial', sans-serif",                google: "Questrial",               category: "sans-serif" },
  { name: "Archivo",                value: "'Archivo', sans-serif",                  google: "Archivo",                 category: "sans-serif" },
  { name: "Prompt",                 value: "'Prompt', sans-serif",                   google: "Prompt",                  category: "sans-serif" },
  { name: "Sarabun",                value: "'Sarabun', sans-serif",                  google: "Sarabun",                 category: "sans-serif" },
  { name: "Chivo",                  value: "'Chivo', sans-serif",                    google: "Chivo",                   category: "sans-serif" },
  { name: "Schibsted Grotesk",      value: "'Schibsted Grotesk', sans-serif",        google: "Schibsted+Grotesk",       category: "sans-serif" },
  { name: "Instrument Sans",        value: "'Instrument Sans', sans-serif",          google: "Instrument+Sans",         category: "sans-serif" },
  { name: "Hanken Grotesk",         value: "'Hanken Grotesk', sans-serif",           google: "Hanken+Grotesk",          category: "sans-serif" },
  { name: "Onest",                  value: "'Onest', sans-serif",                    google: "Onest",                   category: "sans-serif" },
  { name: "Geist",                  value: "'Geist', sans-serif",                    google: "Geist",                   category: "sans-serif" },
  { name: "Bricolage Grotesque",    value: "'Bricolage Grotesque', sans-serif",      google: "Bricolage+Grotesque",     category: "sans-serif" },
  { name: "Darker Grotesque",       value: "'Darker Grotesque', sans-serif",         google: "Darker+Grotesque",        category: "sans-serif" },
  { name: "Spline Sans",            value: "'Spline Sans', sans-serif",              google: "Spline+Sans",             category: "sans-serif" },
  { name: "Syne",                   value: "'Syne', sans-serif",                     google: "Syne",                    category: "sans-serif" },
  { name: "Familjen Grotesk",       value: "'Familjen Grotesk', sans-serif",         google: "Familjen+Grotesk",        category: "sans-serif" },
  { name: "Encode Sans",            value: "'Encode Sans', sans-serif",              google: "Encode+Sans",             category: "sans-serif" },
  { name: "Ysabeau",                value: "'Ysabeau', sans-serif",                  google: "Ysabeau",                 category: "sans-serif" },
  { name: "Noto Sans Display",      value: "'Noto Sans Display', sans-serif",        google: "Noto+Sans+Display",       category: "sans-serif" },
  { name: "Red Hat Display",        value: "'Red Hat Display', sans-serif",          google: "Red+Hat+Display",         category: "sans-serif" },
  { name: "IBM Plex Sans",          value: "'IBM Plex Sans', sans-serif",            google: "IBM+Plex+Sans",           category: "sans-serif" },
  { name: "Atkinson Hyperlegible",  value: "'Atkinson Hyperlegible', sans-serif",    google: "Atkinson+Hyperlegible",   category: "sans-serif" },
  { name: "Exo",                    value: "'Exo', sans-serif",                      google: "Exo",                     category: "sans-serif" },
  { name: "Kumbh Sans",             value: "'Kumbh Sans', sans-serif",               google: "Kumbh+Sans",              category: "sans-serif" },
  { name: "Nunito",                 value: "'Nunito', sans-serif",                   google: "Nunito",                  category: "sans-serif" },
  { name: "Alata",                  value: "'Alata', sans-serif",                    google: "Alata",                   category: "sans-serif" },

  // ── Monospace ─────────────────────────────────────────────────────────────
  { name: "Courier Prime",          value: "'Courier Prime', monospace",             google: "Courier+Prime",           category: "monospace" },
  { name: "Source Code Pro",        value: "'Source Code Pro', monospace",           google: "Source+Code+Pro",         category: "monospace" },
  { name: "IBM Plex Mono",          value: "'IBM Plex Mono', monospace",             google: "IBM+Plex+Mono",           category: "monospace" },
  { name: "Fira Code",              value: "'Fira Code', monospace",                 google: "Fira+Code",               category: "monospace" },
  { name: "Inconsolata",            value: "'Inconsolata', monospace",               google: "Inconsolata",             category: "monospace" },
  { name: "Roboto Mono",            value: "'Roboto Mono', monospace",               google: "Roboto+Mono",             category: "monospace" },
  { name: "Space Mono",             value: "'Space Mono', monospace",                google: "Space+Mono",              category: "monospace" },
  { name: "DM Mono",                value: "'DM Mono', monospace",                   google: "DM+Mono",                 category: "monospace" },
  { name: "Anonymous Pro",          value: "'Anonymous Pro', monospace",             google: "Anonymous+Pro",           category: "monospace" },
  { name: "Ubuntu Mono",            value: "'Ubuntu Mono', monospace",               google: "Ubuntu+Mono",             category: "monospace" },
  { name: "Noto Sans Mono",         value: "'Noto Sans Mono', monospace",            google: "Noto+Sans+Mono",          category: "monospace" },
  { name: "Cousine",                value: "'Cousine', monospace",                   google: "Cousine",                 category: "monospace" },
  { name: "PT Mono",                value: "'PT Mono', monospace",                   google: "PT+Mono",                 category: "monospace" },
  { name: "Share Tech Mono",        value: "'Share Tech Mono', monospace",           google: "Share+Tech+Mono",         category: "monospace" },
];

/** Inject a Google Font <link> tag into document.head if not already loaded */
export function loadGoogleFont(font: ResumeFont): void {
  if (typeof document === "undefined" || !font.google) return;
  const id = `gfont-${font.google}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/** Get the font object by CSS value */
export function getFontByValue(value: string): ResumeFont | undefined {
  return RESUME_FONTS.find(f => f.value === value);
}

/** Returns Google Fonts import URLs for a set of font values (for PDF/print HTML) */
export function getGoogleFontLinks(fontValues: string[]): string {
  return RESUME_FONTS
    .filter(f => f.google && fontValues.includes(f.value))
    .map(f => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f.google}:wght@300;400;500;600;700&display=swap">`)
    .join("\n");
}
