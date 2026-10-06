import { useCallback, useEffect, useMemo, useState } from "react";
import { works, type Category, type Work } from "./data/works";

type CategoryFilter = "All" | Category;
type YearFilter = "All years" | number;
type ProjectGroup = {
  key: string;
  project: string;
  title: string;
  representative: Work;
  images: Work[];
};

const categories: CategoryFilter[] = [
  "All",
  "Poster",
  "Banner",
  "Signage",
  "Promotional",
  "Print",
  "Thumbnail",
  "music graphic",
  "sticker",
  "SNS",
  "illustration",
  "cartoon",
  "apparel",
  "graphic",
  "identity",
  "editorial",
  "environmental graphic",
  "goods",
];

function groupByProject(items: Work[]): ProjectGroup[] {
  const groups = new Map<string, Work[]>();

  items.forEach((work) => {
    const groupKey = [work.project, work.series ?? "", work.episode ?? ""].join("::");
    const projectWorks = groups.get(groupKey) ?? [];
    projectWorks.push(work);
    groups.set(groupKey, projectWorks);
  });

  return Array.from(groups, ([key, projectWorks]) => {
    const orderedWorks = [...projectWorks].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
    const representative = orderedWorks.find((work) => work.featured) ?? orderedWorks[0];

    return {
      key,
      project: orderedWorks[0].project,
      title: orderedWorks[0].projectTitle ?? representative.title,
      representative,
      images: orderedWorks,
    };
  }).sort(
    (a, b) =>
      b.representative.year - a.representative.year ||
      (b.representative.chronologyRank ?? 0) -
        (a.representative.chronologyRank ?? 0) ||
      b.representative.date.localeCompare(a.representative.date),
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

const stickerGroupOrder = ["놀거리", "먹거리", "체험"] as const;
const quarterOrder = ["1분기", "2분기", "3분기"] as const;

function ProjectPreview({ images }: { images: Work[] }) {
  return (
    <div className={`project-preview project-preview-${Math.min(images.length, 3)} overflow-hidden`}>
      {images.slice(0, 3).map((work) => (
        <div className="project-preview-item" key={work.id}>
          <img className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.015]" src={work.image} alt={work.alt} loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function WorkCard({
  group,
  onOpen,
}: {
  group: ProjectGroup;
  onOpen: (group: ProjectGroup) => void;
}) {
  const work = group.representative;
  const previewImages =
    group.images.some((image) => image.stickerGroup)
      ? group.images
      : work.featured || work.category === "cartoon" || work.deliverable
      ? [work]
      : group.images;

  return (
    <article className="work-card group break-inside-avoid">
      <button
        className="work-card-button block w-full cursor-pointer text-left"
        onClick={() => onOpen(group)}
        type="button"
        aria-label={`${group.title} 프로젝트 이미지 ${group.images.length}장 보기`}
      >
        <div className="image-wrap">
          <ProjectPreview images={previewImages} />
          <span className="view-label absolute bottom-3 right-3 translate-y-1 bg-[#f5f3ed] px-3 py-2 text-[10px] uppercase tracking-[0.14em] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            View project <Arrow />
          </span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-4 border-t border-stone-300 pt-2">
          <h3 className="min-w-0 break-words text-[15px] font-medium tracking-tight">{group.title}</h3>
          <div className="flex shrink-0 gap-4 text-[11px] tracking-[0.08em] text-stone-500">
            <span className="capitalize">{work.category}</span>
            <span>{work.year}</span>
          </div>
        </div>
      </button>
    </article>
  );
}

function DetailModal({
  group,
  relatedGroups,
  onClose,
  onNavigate,
  onOpenRelated,
}: {
  group: ProjectGroup;
  relatedGroups: ProjectGroup[];
  onClose: () => void;
  onNavigate: (direction: number) => void;
  onOpenRelated: (group: ProjectGroup) => void;
}) {
  const work = group.representative;
  const hasStickerGroups = group.images.some((image) => image.stickerGroup);
  const hasQuarterGroups = group.images.some((image) => image.quarter);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate(1);
      if (event.key === "ArrowLeft") onNavigate(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, onNavigate]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-[2px] md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal-panel flex max-h-[94dvh] w-full flex-col overflow-x-hidden bg-[#f5f3ed] md:max-h-none md:w-[94vw] xl:w-[90vw]">
        <div className="flex min-h-11 items-center justify-between border-b border-stone-300 px-5 md:px-8">
          <p className="text-[10px] uppercase tracking-[0.15em]">
            Project images / {group.images.length.toString().padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer px-2 text-[11px] uppercase tracking-[0.12em] underline-offset-4 hover:underline"
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal-content grid min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.65fr)] xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.55fr)]">
          <div className="modal-image block min-w-0 overflow-x-hidden p-5 md:p-8 xl:p-10">
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-stone-500">
                <span>Project Images</span>
                <span>{group.images.length} works</span>
              </div>
              {hasStickerGroups ? (
                <div className="space-y-10">
                  {stickerGroupOrder.map((stickerGroup) => {
                    const groupImages = group.images.filter(
                      (image) => image.stickerGroup === stickerGroup,
                    );
                    if (groupImages.length === 0) return null;

                    return (
                      <section key={stickerGroup} aria-labelledby={`sticker-group-${stickerGroup}`}>
                        <h3
                          id={`sticker-group-${stickerGroup}`}
                          className="mb-4 border-t border-stone-300 pt-3 text-xs font-medium tracking-[0.08em]"
                        >
                          {stickerGroup}
                        </h3>
                        <div className="grid grid-cols-1 items-start gap-6">
                          {groupImages.map((image) => {
                            const index = group.images.findIndex((work) => work.id === image.id);
                            return (
                              <figure className="m-0 min-w-0" key={image.id}>
                                <img
                                  className="block h-auto w-full max-w-full object-contain"
                                  src={image.image}
                                  alt={image.alt}
                                />
                                <figcaption className="mt-2 flex justify-between gap-4 text-[10px] tracking-[0.1em] text-stone-500">
                                  <span className="min-w-0 break-words">{image.title}</span>
                                  <span>{String(index + 1).padStart(2, "0")}</span>
                                </figcaption>
                              </figure>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : hasQuarterGroups ? (
                <div className="space-y-12">
                  {quarterOrder.map((quarter) => {
                    const quarterImages = group.images.filter(
                      (image) => image.quarter === quarter,
                    );
                    if (quarterImages.length === 0) return null;

                    const quarterWork = quarterImages[0];

                    return (
                      <section key={quarter} aria-labelledby={`quarter-${quarter}`}>
                        <div className="mb-5 border-t border-stone-300 pt-3">
                          <h3
                            id={`quarter-${quarter}`}
                            className="text-sm font-medium tracking-[-0.01em]"
                          >
                            {quarter} · {quarterWork.quarterTheme}
                          </h3>
                          <p className="mt-1 text-[10px] tracking-[0.1em] text-stone-500">
                            {quarterWork.date}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 items-start gap-6">
                          {quarterImages.map((image) => {
                            const index = group.images.findIndex((work) => work.id === image.id);
                            return (
                              <figure className="m-0 min-w-0" key={image.id}>
                                <img
                                  className="block h-auto w-full max-w-full object-contain"
                                  src={image.image}
                                  alt={image.alt}
                                />
                                <figcaption className="mt-2 flex justify-between gap-4 text-[10px] tracking-[0.1em] text-stone-500">
                                  <span className="min-w-0 break-words">{image.title}</span>
                                  <span>{String(index + 1).padStart(2, "0")}</span>
                                </figcaption>
                              </figure>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="project-image-gallery grid grid-cols-1 items-start gap-6">
                  {group.images.map((image, index) => (
                    <figure className="m-0 min-w-0" key={image.id}>
                      <img
                        className="block h-auto w-full max-w-full object-contain"
                        src={image.image}
                        alt={image.alt}
                      />
                      <figcaption className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.1em] text-stone-500">
                        <span className="min-w-0 break-words">{image.title}</span>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between border-l border-stone-300 p-5 md:p-8 lg:p-10">
            <div>
              <div className="mb-12 flex justify-between text-[10px] tracking-[0.12em] text-stone-500">
                <span className="capitalize">{work.category}</span>
                <span>{work.date}</span>
              </div>
              <h2 id="work-title" className="max-w-md break-words text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.04em]">
                {group.title}
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-stone-600">{work.description}</p>
              <dl className="mt-10 grid grid-cols-[100px_1fr] gap-y-3 border-t border-stone-300 pt-4 text-xs">
                <dt className="uppercase tracking-[0.1em] text-stone-500">Project</dt>
                <dd className="break-words">{work.project}</dd>
                <dt className="uppercase tracking-[0.1em] text-stone-500">Department</dt>
                <dd>{work.department}</dd>
                {work.parentEvent && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Parent event</dt>
                    <dd>{work.parentEvent}</dd>
                  </>
                )}
                <dt className="uppercase tracking-[0.1em] text-stone-500">Category</dt>
                <dd className="capitalize">{work.category}</dd>
                {work.theme && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Theme</dt>
                    <dd>{work.theme}</dd>
                  </>
                )}
                {work.eventType && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Event type</dt>
                    <dd>{work.eventType}</dd>
                  </>
                )}
                {work.variant && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Variant</dt>
                    <dd>{work.variant}</dd>
                  </>
                )}
                {work.subcategory && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Subcategory</dt>
                    <dd className="capitalize">{work.subcategory}</dd>
                  </>
                )}
                <dt className="uppercase tracking-[0.1em] text-stone-500">Year</dt>
                <dd>{work.year}</dd>
                {work.eventYear && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Event year</dt>
                    <dd>{work.eventYear}</dd>
                  </>
                )}
                {work.deliverable && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Deliverable</dt>
                    <dd>{work.deliverable}</dd>
                  </>
                )}
                {work.series && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Series</dt>
                    <dd>{work.series}</dd>
                  </>
                )}
                {work.episode !== undefined && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Episode</dt>
                    <dd>{work.episode}</dd>
                  </>
                )}
                {work.tags && (
                  <>
                    <dt className="uppercase tracking-[0.1em] text-stone-500">Tags</dt>
                    <dd className="flex flex-wrap gap-x-3 gap-y-1">
                      {work.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </dd>
                  </>
                )}
              </dl>
              <div className="mt-10 border-t border-stone-300 pt-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Related Works</p>
                {relatedGroups.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {relatedGroups.map((relatedGroup) => (
                      <button
                        type="button"
                        key={relatedGroup.key}
                        onClick={() => onOpenRelated(relatedGroup)}
                        className="grid min-h-11 w-full cursor-pointer grid-cols-[64px_1fr] items-center gap-3 border-t border-stone-300 py-3 text-left"
                      >
                        <img
                          className="h-16 w-16 object-contain"
                          src={relatedGroup.representative.image}
                          alt=""
                        />
                        <span className="min-w-0">
                          <span className="block text-[10px] uppercase tracking-[0.1em] text-stone-500">
                            {relatedGroup.representative.episode !== undefined
                              ? `Episode ${relatedGroup.representative.episode}`
                              : relatedGroup.representative.series ??
                                relatedGroup.representative.category}
                          </span>
                          <span className="mt-1 block break-words text-xs leading-snug">
                            {relatedGroup.representative.title}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed">
                    동일 프로젝트 그룹의 이미지 {group.images.length}장이 Project Images에 함께 표시됩니다.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-14 flex justify-between border-t border-stone-300 pt-4">
              <button className="min-h-11 cursor-pointer text-xs uppercase tracking-wider hover:underline" type="button" onClick={() => onNavigate(-1)}>
                ← Previous
              </button>
              <button className="min-h-11 cursor-pointer text-xs uppercase tracking-wider hover:underline" type="button" onClick={() => onNavigate(1)}>
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [yearFilter, setYearFilter] = useState<YearFilter>("All years");
  const [tagFilter, setTagFilter] = useState("All tags");
  const [activeGroup, setActiveGroup] = useState<ProjectGroup | null>(null);

  const projectGroups = useMemo(() => groupByProject(works), []);
  const years = useMemo(
    () => Array.from(new Set(works.map((work) => work.year))).sort((a, b) => b - a),
    [],
  );
  const tags = useMemo(
    () => Array.from(new Set(works.flatMap((work) => work.tags ?? []))).sort(),
    [],
  );
  const filteredGroups = useMemo(
    () =>
      projectGroups.filter(
        (group) =>
          (categoryFilter === "All" ||
            group.images.some((work) => work.category === categoryFilter)) &&
          (yearFilter === "All years" || group.representative.year === yearFilter) &&
          (tagFilter === "All tags" ||
            group.images.some((work) => work.tags?.includes(tagFilter))),
      ),
    [categoryFilter, projectGroups, tagFilter, yearFilter],
  );
  const featuredGroups = projectGroups.filter(
    (group) =>
      group.representative.projectFeatured ??
      group.images.some((work) => work.featured),
  );

  const navigate = useCallback(
    (direction: number) => {
      if (!activeGroup || projectGroups.length === 0) return;
      const current = projectGroups.findIndex((group) => group.key === activeGroup.key);
      setActiveGroup(projectGroups[(current + direction + projectGroups.length) % projectGroups.length]);
    },
    [activeGroup, projectGroups],
  );

  return (
    <main className="min-h-screen bg-[#f5f3ed] text-[#171714]">
      <header className="border-b border-stone-300">
        <div className="page-container header-layout py-4">
          <a href="#" className="flex min-h-11 items-center text-base font-semibold tracking-[-0.04em]">
            AR—CHIVE
          </a>
          <p className="text-[10px] uppercase leading-snug tracking-[0.13em] text-stone-500">
            Independent graphic design practice
            <br />
            Seoul / Working globally
          </p>
          <a className="flex min-h-11 items-center text-[11px] uppercase tracking-[0.12em] underline-offset-4 hover:underline md:justify-end" href="mailto:studio@archive.design">
            Contact&nbsp;<Arrow />
          </a>
        </div>
      </header>

      <section className="page-container pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="mb-12 flex items-end justify-between md:mb-16">
          <h1 className="max-w-[1100px] break-words text-[clamp(3.2rem,10.5vw,10.5rem)] font-medium leading-[0.82] tracking-[-0.075em]">
            CHURCH DESIGN
            <br />
            <span className="ml-[0.75em] font-serif italic font-normal">PORTFOLIO</span>
            <span className="align-top text-[0.12em] font-normal tracking-normal">®</span>
          </h1>
          <p className="mb-2 hidden max-w-[210px] text-xs leading-relaxed text-stone-600 lg:block">
            A living archive of identities, campaigns, and spatial graphics made from 2023 to the present.
          </p>
        </div>

        {featuredGroups.length > 0 && (
          <div className="featured-grid grid">
            {featuredGroups.map((group, index) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`featured-card featured-card-${index + 1} group relative cursor-pointer overflow-hidden bg-stone-200 text-left`}
              >
                <ProjectPreview images={[group.representative]} />
                <span className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-16 text-white">
                  <span className="text-sm font-medium">{group.title}</span>
                  <span className="text-[10px] tracking-wider">
                    {group.representative.category} / {group.representative.year}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section id="archive" className="border-t border-stone-300">
        <div className="page-container pb-24 pt-5">
          <div className="archive-heading mb-14 grid items-start">
            <div className="archive-heading-title">
              <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500">Archive / 2023—26</p>
              <h2 className="mt-4 text-5xl font-medium tracking-[-0.055em] md:text-7xl">All works</h2>
            </div>
            <div className="filter-nav -mx-5 min-w-0 overflow-x-auto px-5 md:mx-0 md:px-0">
              <div className="flex min-w-max items-center justify-end gap-x-5">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    aria-pressed={categoryFilter === category}
                    className={`min-h-11 shrink-0 cursor-pointer text-xs tracking-[0.1em] transition-colors ${
                      categoryFilter === category ? "text-blue-700 underline underline-offset-4" : "text-stone-500 hover:text-stone-950"
                    } ${category === "illustration" ? "capitalize" : "uppercase"}`}
                  >
                    {category}
                  </button>
                ))}
                <span className="h-4 w-px shrink-0 bg-stone-300" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setYearFilter("All years")}
                  aria-pressed={yearFilter === "All years"}
                  className={`min-h-11 shrink-0 cursor-pointer text-xs uppercase tracking-[0.1em] ${
                    yearFilter === "All years" ? "text-blue-700 underline underline-offset-4" : "text-stone-500 hover:text-stone-950"
                  }`}
                >
                  All years
                </button>
                {years.map((year) => (
                  <button
                    type="button"
                    key={year}
                    onClick={() => setYearFilter(year)}
                    aria-pressed={yearFilter === year}
                    className={`min-h-11 shrink-0 cursor-pointer text-xs tracking-[0.1em] ${
                      yearFilter === year ? "text-blue-700 underline underline-offset-4" : "text-stone-500 hover:text-stone-950"
                    }`}
                  >
                    {year}
                  </button>
                ))}
                {tags.length > 0 && (
                  <>
                    <span className="h-4 w-px shrink-0 bg-stone-300" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setTagFilter("All tags")}
                      aria-pressed={tagFilter === "All tags"}
                      className={`min-h-11 shrink-0 cursor-pointer text-xs uppercase tracking-[0.1em] ${
                        tagFilter === "All tags"
                          ? "text-blue-700 underline underline-offset-4"
                          : "text-stone-500 hover:text-stone-950"
                      }`}
                    >
                      All tags
                    </button>
                    {tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setTagFilter(tag)}
                        aria-pressed={tagFilter === tag}
                        className={`min-h-11 shrink-0 cursor-pointer text-xs tracking-[0.1em] ${
                          tagFilter === tag
                            ? "text-blue-700 underline underline-offset-4"
                            : "text-stone-500 hover:text-stone-950"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {years.map((year) => {
            const yearGroups = filteredGroups.filter((group) => group.representative.year === year);
            if (yearGroups.length === 0) return null;

            return (
              <section className="year-section mb-20" key={year} aria-labelledby={`year-${year}`}>
                <div className="mb-7 flex items-baseline justify-between border-t border-stone-300 pt-3">
                  <h3 id={`year-${year}`} className="text-2xl font-medium tracking-[-0.04em]">{year}</h3>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                    {yearGroups.length.toString().padStart(2, "0")} projects
                  </p>
                </div>
                <div className="archive-grid columns-1">
                  {yearGroups.map((group) => (
                    <WorkCard key={group.key} group={group} onOpen={setActiveGroup} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-stone-300">
        <div className="page-container pb-8 pt-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-stone-500">
            <p>Archive Studio © 2026</p>
            <a href="#" className="flex min-h-11 items-center hover:text-stone-950">Back to top ↑</a>
          </div>
          <p className="mt-14 text-[clamp(3rem,9.5vw,9rem)] font-medium leading-none tracking-[-0.07em]">Make it visible.</p>
        </div>
      </footer>

      {activeGroup && (
        <DetailModal
          key={activeGroup.key}
          group={activeGroup}
          relatedGroups={projectGroups.filter(
            (group) => group.project === activeGroup.project && group.key !== activeGroup.key,
          )}
          onClose={() => setActiveGroup(null)}
          onNavigate={navigate}
          onOpenRelated={setActiveGroup}
        />
      )}
    </main>
  );
}
