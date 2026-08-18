-- =========================================================================
-- Academic Notebook Portfolio Supabase Clean Setup & Seed Script
-- (Completely resets and initializes all tables cleanly)
-- =========================================================================

-- Drop existing tables to ensure clean schema with correct types
drop table if exists note_sections cascade;
drop table if exists notes cascade;
drop table if exists portfolio_about cascade;
drop table if exists portfolio_hero cascade;
drop table if exists portfolio_meta cascade;

-- 1. Metadata Table
create table portfolio_meta (
  id text primary key default 'main',
  author_name text not null default 'Karan',
  logo_text text not null default 'Karan',
  avatar_url text default 'avatar.jpg',
  page_title text not null,
  meta_description text,
  copyright_year int default 2026,
  social_links jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Hero Section Table
create table portfolio_hero (
  id text primary key default 'main',
  heading text not null default 'Notes and exploratory research.',
  bio_highlight text not null default 'Karan',
  bio_intro text not null,
  more_about_text text default 'More about me.',
  more_about_anchor text default '#about'
);

-- 3. About Section Table
create table portfolio_about (
  id text primary key default 'main',
  section_label text default 'About & Focus',
  paragraphs text[] not null
);

-- 4. Research Notes Table
create table notes (
  id text primary key,
  slug text unique not null,
  type text not null default 'NOTE' check (type in ('ESSAY', 'NOTE', 'LOG', 'PAPER')),
  date date not null,
  formatted_date text not null,
  read_time text not null default '15 min',
  tags text[] default array[]::text[],
  title text not null,
  summary text not null,
  subtitle text,
  published boolean default true,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Note Subsections Table (For Google Docs Outline Reader)
create table note_sections (
  id uuid primary key default gen_random_uuid(),
  note_id text references notes(id) on delete cascade,
  section_anchor_id text not null,
  title text not null,
  content text not null,
  sort_order int not null default 0
);

-- Enable Row Level Security (RLS)
alter table portfolio_meta enable row level security;
alter table portfolio_hero enable row level security;
alter table portfolio_about enable row level security;
alter table notes enable row level security;
alter table note_sections enable row level security;

-- Create Public Read Policies
create policy "Allow public read access on portfolio_meta" on portfolio_meta for select using (true);
create policy "Allow public read access on portfolio_hero" on portfolio_hero for select using (true);
create policy "Allow public read access on portfolio_about" on portfolio_about for select using (true);
create policy "Allow public read access on notes" on notes for select using (published = true);
create policy "Allow public read access on note_sections" on note_sections for select using (true);

-- =========================================================================
-- SEED DATA
-- =========================================================================

-- Insert Metadata
insert into portfolio_meta (id, author_name, logo_text, avatar_url, page_title, meta_description, copyright_year, social_links)
values (
  'main',
  'Karan',
  'Karan',
  'avatar.jpg',
  'Karan — Notes & Exploratory Research',
  'Personal notebook and exploratory research on learning algorithms, AI for science, and quantum computing.',
  2026,
  '[{"platform": "GitHub", "url": "https://github.com"}, {"platform": "Twitter", "url": "https://twitter.com"}, {"platform": "Email", "url": "mailto:karan@research.org"}]'::jsonb
);

-- Insert Hero
insert into portfolio_hero (id, heading, bio_highlight, bio_intro, more_about_text, more_about_anchor)
values (
  'main',
  'Notes and exploratory research.',
  'Karan',
  'I think about learning algorithms, AI for science, and quantum computing.',
  'More about me.',
  '#about'
);

-- Insert About
insert into portfolio_about (id, section_label, paragraphs)
values (
  'main',
  'About & Focus',
  array[
    'I explore representations in neural systems, high-dimensional computing, and how algebraic mathematical structures translate into computational substrates.',
    'Currently spending time writing notes, building small exploratory models, and reading literature across machine learning theory, cognitive architectures, and physics-informed computational frameworks.'
  ]
);

-- Seed Note 1
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values (
  'note-1',
  'bundling-binding-representation',
  'ESSAY',
  '2026-04-22',
  'Apr 22, 2026',
  '30 min',
  array['#hdc', '#interpretability', '#notes'],
  'Bundling, Binding, And Other Things Your Brain Probably Does, Or Not',
  'An exploratory walk through the algebra of compositional representation.',
  'An exploratory walk through the algebra of compositional representation and vector symbolic architectures.',
  true,
  1
);

insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
  ('note-1', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> How do distributed continuous representations encode structured symbolic hierarchies without suffering exponential explosion in dimensionality? We examine Vector Symbolic Architectures (VSA / Hyperdimensional Computing) and mechanistic transformer interpretability to understand how biological neural circuits and continuous embeddings solve variable binding and compositionality.</div>', 1),
  ('note-1', 'sec-1', '1. The Superposition Dilemma & Symbolic Graphs', '<p>Classical symbolic AI represents complex compositions using discrete syntactic parse trees, pointer graphs, and recursive tuples. In biological neural tissue and continuous machine learning architectures, however, everything exists as a dense or sparse vector in high-dimensional hyperspace $\mathbb{R}^D$ where $D \ge 10^4$.</p><p>When multiple concepts are simultaneously activated in the same neural substrate, their raw activation patterns linearly superimpose. Without structured algebra, this leads to the classic <em>binding problem</em>: if the network activates $\text{Circle}$, $\text{Square}$, $\text{Red}$, and $\text{Blue}$, how does downstream circuitry know whether it is perceiving a $\text{Red Circle}$ and $\text{Blue Square}$, or a $\text{Blue Circle}$ and $\text{Red Square}$?</p>', 2),
  ('note-1', 'sec-2', '2. Vector Symbolic Algebraic Operators', '<p>Vector Symbolic Architectures define an algebraic ring over high-dimensional hyperspaces with three fundamental operations: Bundling ($+$), Binding ($\otimes$), and Permutation ($\Pi$).</p>', 3),
  ('note-1', 'sec-3', '3. Mathematical Formulation of Hyperdimensional Spaces', '<p>Because high-dimensional hyperspheres exhibit concentration of measure, any two randomly sampled independent vectors $\mathbf{u}, \mathbf{v} \sim \mathcal{S}^{D-1}$ satisfy bounded Gaussian cross-talk orthogonality.</p>', 4),
  ('note-1', 'sec-4', '4. Unbinding, Clean-Up Memories, and Noise Tolerance', '<p>To query a composite vector for a specific role filler, we perform algebraic unbinding by multiplying with the exact pseudoinverse of the role key.</p>', 5),
  ('note-1', 'sec-5', '5. Neural Substrates and Mechanistic Interpretability', '<p>Recent mechanistic interpretability findings in attention induction heads demonstrate that early layers project continuous key-query pairs into orthogonal subspaces.</p>', 6),
  ('note-1', 'sec-6', '6. Open Questions & Future Directions', '<p>Key challenges remain in scaling differentiable VSA across neuromorphic and quantum systems.</p>', 7);

-- Seed Note 2
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values (
  'note-2',
  'phase-transitions-linear-attention',
  'NOTE',
  '2026-02-14',
  'Feb 14, 2026',
  '14 min',
  array['#theory', '#transformers', '#mechanistic'],
  'Phase Transitions in Small Linear Attention Networks',
  'Tracing sudden emergence of in-context induction capabilities across training trajectories in toy attention models.',
  'Tracing sudden emergence of in-context induction capabilities across training trajectories in toy attention models.',
  true,
  2
);

insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
  ('note-2', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We study the training dynamics of a 2-layer linear attention model on synthetic Markovian n-gram tasks.</div>', 1),
  ('note-2', 'sec-1', '1. The Mystery of In-Context Induction', '<p>During pre-training of transformer architectures, empirical evaluation curves often display extended loss plateaus followed by an abrupt, steep descent.</p>', 2),
  ('note-2', 'sec-2', '2. Minimal Model Architecture & Mathematical Setup', '<p>We isolate a minimal 2-layer linear self-attention network without non-linear MLPs.</p>', 3),
  ('note-2', 'sec-3', '3. Spectral Dynamics of Query-Key Matrices', '<p>By performing SVD on $M = W_Q^{(2)} (W_K^{(2)})^T$, we observe silent vector rotation during the initial training plateau.</p>', 4);

-- Seed Note 3
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values (
  'note-3',
  'geometric-priors-quantum-tomography',
  'NOTE',
  '2025-11-08',
  'Nov 08, 2025',
  '22 min',
  array['#quantum', '#geometry', '#optimization'],
  'Geometric Priors for Quantum State Tomography',
  'Constraining density matrix reconstruction using Riemannian manifold geometry and symmetry group invariants.',
  'Constraining density matrix reconstruction using Riemannian manifold geometry and symmetry group invariants.',
  true,
  3
);

insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
  ('note-3', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> Reconstructing density matrices on Riemannian quotient manifolds.</div>', 1),
  ('note-3', 'sec-1', '1. Reconstructing Density Matrices from Pauli Measurements', '<p>Quantum state tomography requires determining the complex density operator $\rho$.</p>', 2),
  ('note-3', 'sec-2', '2. Riemannian Quotient Manifold Formulation', '<p>By factorizing $\rho = Y Y^\dagger$, state space is modeled on the quotient manifold.</p>', 3);

-- Seed Note 4
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values (
  'note-4',
  'gradient-starvation-spectral-bias',
  'ESSAY',
  '2025-08-19',
  'Aug 19, 2025',
  '18 min',
  array['#deep-learning', '#spectral-bias'],
  'On Gradient Starvation and Spectral Bias in Deep ResNets',
  'Why deep residual networks default to low-frequency features, and what happens when you force high-frequency signal propagation.',
  'Why deep residual networks default to low-frequency features, and what happens when you force high-frequency signal propagation.',
  true,
  4
);

insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
  ('note-4', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We analyze Neural Tangent Kernels in residual architectures.</div>', 1),
  ('note-4', 'sec-1', '1. Spectral Bias in Neural Tangent Kernels', '<p>Under gradient descent, neural networks learn low-frequency Fourier modes exponentially faster.</p>', 2);

-- Seed Note 5
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values (
  'note-5',
  'variational-inference-dynamical-systems',
  'NOTE',
  '2025-05-03',
  'May 03, 2025',
  '12 min',
  array['#variational-methods', '#sde', '#dynamics'],
  'Notes on Variational Inference for Continuous Dynamical Systems',
  'A continuous-time formulation of evidence lower bounds (ELBO) parameterized with stochastic differential equations.',
  'A continuous-time formulation of evidence lower bounds (ELBO) parameterized with stochastic differential equations.',
  true,
  5
);

insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
  ('note-5', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> Continuous-time evidence lower bounds for SDE latent paths.</div>', 1),
  ('note-5', 'sec-1', '1. Continuous-Time Latent Trajectories & SDEs', '<p>Applying Girsanov change of measure yields exact continuous-time path KL divergence.</p>', 2);
