import { FormEvent, useEffect, useMemo, useState } from "react";

type ApplicationStatus = "Applied" | "Interview" | "Offer" | "Rejected" | "Saved";
type SortDirection = "newest" | "oldest";

type JobApplication = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  link: string;
  notes: string;
};

type ApplicationForm = Omit<JobApplication, "id">;

const STORAGE_KEY = "job-application-tracker:applications";

const statuses: ApplicationStatus[] = ["Applied", "Interview", "Offer", "Rejected", "Saved"];

const emptyForm: ApplicationForm = {
  company: "",
  role: "",
  status: "Applied",
  dateApplied: new Date().toISOString().slice(0, 10),
  link: "",
  notes: ""
};

const starterApplications: JobApplication[] = [
  {
    id: "sample-1",
    company: "Northstar Studio",
    role: "Junior Front-End Developer",
    status: "Interview",
    dateApplied: "2026-06-02",
    link: "https://example.com",
    notes: "Prepare examples of responsive layouts and dashboard work."
  },
  {
    id: "sample-2",
    company: "Brightline Health",
    role: "UI Developer",
    status: "Applied",
    dateApplied: "2026-05-29",
    link: "",
    notes: "Follow up after one week if there is no response."
  },
  {
    id: "sample-3",
    company: "Gallery Labs",
    role: "Web Designer",
    status: "Saved",
    dateApplied: "2026-05-24",
    link: "https://example.com/careers",
    notes: "Portfolio-heavy role. Tailor cover letter around image presentation."
  }
];

function createId() {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `application-${Date.now()}`;
}

function loadApplications() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return starterApplications;

  try {
    return JSON.parse(saved) as JobApplication[];
  } catch {
    return starterApplications;
  }
}

function formatDate(value: string) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(loadApplications);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const summary = useMemo(() => {
    return statuses.map((status) => ({
      status,
      count: applications.filter((application) => application.status === status).length
    }));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications
      .filter((application) => {
        const matchesStatus = statusFilter === "All" || application.status === statusFilter;
        const matchesSearch =
          application.company.toLowerCase().includes(normalizedQuery) ||
          application.role.toLowerCase().includes(normalizedQuery);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const first = new Date(a.dateApplied).getTime();
        const second = new Date(b.dateApplied).getTime();
        return sortDirection === "newest" ? second - first : first - second;
      });
  }, [applications, query, sortDirection, statusFilter]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const company = form.company.trim();
    const role = form.role.trim();

    if (!company || !role || !form.dateApplied) return;

    setApplications((currentApplications) => [
      {
        ...form,
        id: createId(),
        company,
        role,
        link: form.link.trim(),
        notes: form.notes.trim()
      },
      ...currentApplications
    ]);
    setForm({ ...emptyForm, dateApplied: new Date().toISOString().slice(0, 10) });
  };

  const updateForm = (field: keyof ApplicationForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const totalActive = applications.filter((application) => application.status !== "Rejected").length;

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Career Workspace</p>
          <h1 id="page-title">Job Application Tracker</h1>
          <p className="hero-copy">
            Keep every role, follow-up note, and application status in one focused dashboard that
            stays saved in your browser.
          </p>
        </div>
        <div className="hero-stat" aria-label={`${totalActive} active opportunities`}>
          <span>{totalActive}</span>
          <p>active opportunities</p>
        </div>
      </section>

      <section className="summary-grid" aria-label="Application summary">
        <article className="summary-card summary-card-total">
          <p>Total</p>
          <strong>{applications.length}</strong>
        </article>
        {summary.map((item) => (
          <article className="summary-card" key={item.status}>
            <p>{item.status}</p>
            <strong>{item.count}</strong>
          </article>
        ))}
      </section>

      <div className="workspace-grid">
        <section className="panel form-panel" aria-labelledby="form-title">
          <div className="panel-heading">
            <p className="eyebrow">Add Application</p>
            <h2 id="form-title">New opportunity</h2>
          </div>

          <form className="application-form" onSubmit={handleSubmit}>
            <label>
              Company
              <input
                required
                type="text"
                value={form.company}
                onChange={(event) => updateForm("company", event.target.value)}
                placeholder="Acme Studio"
              />
            </label>

            <label>
              Role
              <input
                required
                type="text"
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
                placeholder="Front-End Developer"
              />
            </label>

            <div className="form-row">
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date applied
                <input
                  required
                  type="date"
                  value={form.dateApplied}
                  onChange={(event) => updateForm("dateApplied", event.target.value)}
                />
              </label>
            </div>

            <label>
              Posting link
              <input
                type="url"
                value={form.link}
                onChange={(event) => updateForm("link", event.target.value)}
                placeholder="https://company.com/careers"
              />
            </label>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Interview prep, follow-up timing, contact names..."
                rows={4}
              />
            </label>

            <button className="primary-button" type="submit">
              Add application
            </button>
          </form>
        </section>

        <section className="panel list-panel" aria-labelledby="applications-title">
          <div className="panel-heading list-heading">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h2 id="applications-title">Applications</h2>
            </div>
            <p className="result-count" aria-live="polite">
              {filteredApplications.length} shown
            </p>
          </div>

          <div className="controls" aria-label="Filter and sort applications">
            <label>
              Search
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Company or role"
              />
            </label>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "All")}
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort by date
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>

          {filteredApplications.length > 0 ? (
            <div className="application-list">
              {filteredApplications.map((application) => (
                <article className="application-card" key={application.id}>
                  <div className="card-topline">
                    <span className={`status-pill status-${application.status.toLowerCase()}`}>
                      {application.status}
                    </span>
                    <time dateTime={application.dateApplied}>
                      Applied {formatDate(application.dateApplied)}
                    </time>
                  </div>

                  <div>
                    <h3>{application.role}</h3>
                    <p className="company-name">{application.company}</p>
                  </div>

                  {application.notes && <p className="notes">{application.notes}</p>}

                  <div className="card-actions">
                    {application.link ? (
                      <a href={application.link} target="_blank" rel="noreferrer">
                        View posting
                      </a>
                    ) : (
                      <span>No posting link saved</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="eyebrow">No matches</p>
              <h3>No applications found</h3>
              <p>
                Try changing your search or filter, or add a new application to start tracking your
                pipeline.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;

