const skills = [
  "Java & J2EE",
  "Spring Boot",
  "Microservices",
  "REST APIs",
  "Kafka",
  "Camunda BPM",
  "Guidewire",
  "PostgreSQL",
  "MongoDB",
  "JUnit & Mockito",
  "Jenkins & SonarQube",
  "OpenShift",
  "IBM Db2",
  "Spring AI & OpenAI APIs",
];

const profiles = [
  {
    label: "LinkedIn",
    handle: "/in/sourabh-mhalim",
    href: "https://www.linkedin.com/in/sourabh-mhalim-534ba9252/",
  },
  {
    label: "GitHub",
    handle: "@SourabhMhalim",
    href: "https://github.com/SourabhMhalim",
  },
  {
    label: "Naukri",
    handle: "View job profile",
    href: "https://www.naukri.com/mnjuser/profile?id=&altresid",
  },
];

const projects = [
  {
    id: "01",
    type: "BANKING PLATFORM",
    title: "KBC Business Dashboard",
    description:
      "Led five developers modernizing business banking capabilities into secure Spring Boot microservices across mandates, standing orders, investments, insurance, and custody accounts.",
    impact: ["67 REST APIs delivered", "5-developer team led", "0 critical vulnerabilities"],
    stack: ["Java 17", "Spring Boot", "OpenAPI", "OpenShift"],
    accent: "lime",
  },
  {
    id: "02",
    type: "SAAS PRODUCT",
    title: "SmartRent",
    description:
      "A tenant management and rent-billing platform with automated electricity calculations, invoice generation, payment workflows, and owner and tenant portals.",
    impact: ["Role-based access", "Automated billing", "PDF invoices"],
    stack: ["Java 21", "Next.js", "Supabase", "Docker"],
    accent: "teal",
    href: "/app/smartrent",
  },
  {
    id: "03",
    type: "ERP-LITE",
    title: "Sakas Foods Inventory",
    description:
      "An operations system that tracks grain purchasing, flour production, packaging conversion, stock, sales, GST invoices, barcodes, and manufacturing reports.",
    impact: ["End-to-end traceability", "Multi-size packaging", "GST-ready sales"],
    stack: ["Spring Boot", "PostgreSQL", "Next.js", "Reporting"],
    accent: "blue",
  },
];

const experience = [
  {
    period: "2024 - PRESENT",
    company: "Cognizant",
    role: "Senior Associate - Projects",
    copy: "Managed a five-developer team and delivered 67 REST APIs for KBC's enterprise banking modernization, owning design, OpenAPI contracts, testing, CI/CD, and production release.",
  },
  {
    period: "2022 - 2024",
    company: "Atos Syntel",
    role: "Associate Consultant",
    copy: "Designed and implemented 3-4 Camunda workflows and built two microservices with read APIs integrating Guidewire and legacy insurance systems.",
  },
  {
    period: "2019 - 2022",
    company: "Integrative Systems",
    role: "Senior Production Support - Java",
    copy: "Developed and supported Java, Spring Boot, Angular, and REST applications; investigated production incidents, performed root-cause analysis, and improved application stability.",
  },
  {
    period: "2016 - 2019",
    company: "AG BIM Design and Services",
    role: "Media and Graphics Engineer",
    copy: "Built responsive UI components using HTML, CSS, and JavaScript while delivering visualization and digital-media assets with designers and project managers.",
  },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 19h14" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sourabh Mhalim - home">
          <span className="brand-mark">SM</span>
          <span>Sourabh Mhalim</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
          <a className="nav-profile" href="https://github.com/SourabhMhalim" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Developer · Mentor · Coffee lover</p>
          <h1>Sourabh<br />Mhalim</h1>
          <p className="role">Senior Java Developer</p>
          <p className="specialization">Building Scalable <i /> Reliable <i /> High-Performance Solutions</p>
          <p className="hero-summary">
            I design resilient backend systems, turn complex business flows into
            maintainable software, and mentor developers to deliver with confidence.
          </p>
          <p className="coffee-note"><span>☕</span> Coffee-fueled engineering from Pune, India</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View projects <ArrowIcon />
            </a>
            <a
              className="button button-secondary"
              href="/resume/Sourabh_Mhalim_Resume_Senior_Java_Developer.pdf"
              download
            >
              Download resume <DownloadIcon />
            </a>
          </div>
          <div className="profile-links" aria-label="Professional profiles">
            {profiles.map((profile) => (
              <a href={profile.href} target="_blank" rel="noreferrer" key={profile.label}>
                <span>{profile.label}</span>
                <small>{profile.handle}</small>
                <b aria-hidden="true">↗</b>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="signal-band" aria-label="Technical specialties and delivery highlights">
        <div className="tech-row">
          {skills.slice(0, 7).map((skill) => <span key={skill}>{skill}</span>)}
        </div>
        <div className="metric-row">
          <span><b>✓</b> 67 REST APIs delivered</span>
          <span><b>◇</b> Team of 5 developers led</span>
          <span><b>▣</b> 0 critical vulnerabilities</span>
        </div>
      </section>

      <section className="section projects" id="work">
        <div className="section-heading">
          <p className="eyebrow"><span /> Selected systems</p>
          <h2>Projects with real-world complexity.</h2>
          <p>From regulated banking platforms to product ideas built around everyday operations.</p>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <article className={`project-card ${project.accent}`} key={project.id}>
              <div className="project-index">{project.id}</div>
              <div className="project-main">
                <p className="project-type">{project.type}</p>
                <h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="impact-list">
                  {project.impact.map((item) => <span key={item}>✓ {item}</span>)}
                </div>
                {project.href ? (
                  <a className="project-link" href={project.href}>
                    Open SmartRent <ArrowIcon />
                  </a>
                ) : null}
              </div>
              <div className="stack-list">
                {project.stack.map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section experience-section" id="experience">
        <div className="experience-column">
          <div className="section-heading compact">
            <p className="eyebrow"><span /> Experience</p>
            <h2>Engineering across the full delivery lifecycle.</h2>
          </div>
          <div className="timeline">
            {experience.map((item) => (
              <article className="timeline-item" key={item.company}>
                <p>{item.period}</p>
                <div>
                  <h3>{item.company}</h3>
                  <h4>{item.role}</h4>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="skills-panel" id="skills">
          <p className="eyebrow"><span /> Technical toolkit</p>
          <h2>Comfortable from API design to production.</h2>
          <div className="skill-cloud">
            {skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
          <div className="principles">
            <div><b>01</b><span><strong>Design for change</strong><small>Clear contracts, modular boundaries, maintainable code.</small></span></div>
            <div><b>02</b><span><strong>Ship with confidence</strong><small>Automated tests, security checks, observable releases.</small></span></div>
            <div><b>03</b><span><strong>Mentor with clarity</strong><small>Practical guidance, thoughtful reviews, dependable ownership.</small></span></div>
          </div>
        </aside>
      </section>

      <footer id="contact">
        <div>
          <p className="eyebrow"><span /> Let&apos;s build something useful</p>
          <h2>Have a backend challenge?</h2>
        </div>
        <div className="footer-actions">
          <a className="button button-primary" href="/resume/Sourabh_Mhalim_Resume_Senior_Java_Developer.pdf" download>
            Download resume <DownloadIcon />
          </a>
          <a className="resume-docx" href="/resume/Sourabh_Mhalim_Resume_Senior_Java_Developer.docx" download>
            Editable Word version
          </a>
          <div className="footer-profiles">
            {profiles.map((profile) => (
              <a href={profile.href} target="_blank" rel="noreferrer" key={profile.label}>{profile.label} ↗</a>
            ))}
          </div>
        </div>
        <p className="footer-note">© 2026 Sourabh Mhalim · Pune, India</p>
      </footer>
    </main>
  );
}
