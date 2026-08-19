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

-- Create Policies (Read & Manage)
create policy "Allow public all access on portfolio_meta" on portfolio_meta for all using (true) with check (true);
create policy "Allow public all access on portfolio_hero" on portfolio_hero for all using (true) with check (true);
create policy "Allow public all access on portfolio_about" on portfolio_about for all using (true) with check (true);
create policy "Allow public all access on notes" on notes for all using (true) with check (true);
create policy "Allow public all access on note_sections" on note_sections for all using (true) with check (true);

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

-- Insert Research Notes
insert into notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
values
(
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
),
(
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
),
(
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
),
(
  'note-4',
  'gradient-starvation-spectral-bias',
  'ESSAY',
  '2025-08-19',
  'Aug 19, 2025',
  '18 min',
  array['#deep-learning', '#spectral-bias', '#gradient-starvation', '#generalization'],
  'On Gradient Starvation and Spectral Bias in Deep ResNets',
  'Why neural networks starve robust compositional features in favor of easy statistical shortcuts, and how cross-entropy induces failure under distribution shifts.',
  'An inquiry into gradient starvation, shortcut learning, feature competition, and out-of-distribution generalization in deep networks.',
  true,
  4
),
(
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

-- Insert Note Subsections (Google Docs Outline & Long-Form Content)
insert into note_sections (note_id, section_anchor_id, title, content, sort_order)
values
-- Note 1 Sections
('note-1', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> How do distributed continuous representations encode structured symbolic hierarchies without suffering exponential explosion in dimensionality? We examine Vector Symbolic Architectures (VSA / Hyperdimensional Computing) and mechanistic transformer interpretability to understand how biological neural circuits and continuous embeddings solve variable binding and compositionality.</div>', 1),
('note-1', 'sec-1', '1. The Superposition Dilemma & Symbolic Graphs', '<p>Classical symbolic AI represents complex compositions using discrete syntactic parse trees, pointer graphs, and recursive tuples. In biological neural tissue and continuous machine learning architectures, however, everything exists as a dense or sparse vector in high-dimensional hyperspace $\mathbb{R}^D$ where $D \ge 10^4$.</p><p>When multiple concepts are simultaneously activated in the same neural substrate, their raw activation patterns linearly superimpose. Without structured algebra, this leads to the classic <em>binding problem</em>: if the network activates $\text{Circle}$, $\text{Square}$, $\text{Red}$, and $\text{Blue}$, how does downstream circuitry know whether it is perceiving a $\text{Red Circle}$ and $\text{Blue Square}$, or a $\text{Blue Circle}$ and $\text{Red Square}$?</p>', 2),
('note-1', 'sec-2', '2. Hyperdimensional Computing: Bundling vs. Binding Operations', '<p>Vector Symbolic Architectures (Kanerva, Plate, Gayler) define two fundamental algebraic operations over hyperspace:</p><ul class="list-disc pl-5 space-y-2 my-4 text-neutral-700"><li><strong>Bundling (Superposition):</strong> $\mathbf{C} = \mathbf{A} + \mathbf{B}$. Preserves cosine similarity: $\langle \mathbf{C}, \mathbf{A} \rangle \approx 1$ and $\langle \mathbf{C}, \mathbf{B} \rangle \approx 1$. Acts as set union.</li><li><strong>Binding (Multiplicative / Circular Convolution):</strong> $\mathbf{X} = \mathbf{A} \circledast \mathbf{B}$. Produces a quasiorthogonal vector: $\langle \mathbf{X}, \mathbf{A} \rangle \approx 0$ and $\langle \mathbf{X}, \mathbf{B} \rangle \approx 0$. Preserves unbinding via involution or inverse: $\mathbf{X} \circledast \mathbf{B}^{-1} \approx \mathbf{A}$.</li></ul>', 3),
('note-1', 'sec-3', '3. Mathematical Proof: Quasi-Orthogonality in Hyperspace', '<p>Let $\mathbf{u}, \mathbf{v} \sim \mathcal{N}(0, \frac{1}{D}\mathbf{I}_D)$ be two independent random vectors uniformly distributed on the unit sphere $\mathbb{S}^{D-1}$. By the Johnson-Lindenstrauss lemma and concentration of measure:</p>$$\mathbb{P}\left(|\langle \mathbf{u}, \mathbf{v} \rangle| \ge \epsilon\right) \le 2\exp\left(-\frac{D\epsilon^2}{2}\right)$$<p>For $D = 10,000$ and $\epsilon = 0.05$, the probability of spurious cross-talk is $\le 10^{-24}$. This enables storing millions of bound variables in linear superposition without catastrophic interference.</p>', 4),
('note-1', 'sec-4', '4. Transformer Induction Heads as Continuous Variable Binders', '<p>Recent mechanistic interpretability findings (Elhage et al., 2021) demonstrate that two-layer transformer circuits form <em>induction heads</em> that mechanically implement soft variable binding: $$\text{Attn}(Q, K, V) = \text{softmax}\left(\frac{W_Q \mathbf{x}_i (W_K \mathbf{x}_j)^T}{\sqrt{d_k}}\right) W_V \mathbf{x}_j$$</p><p>The $W_{OV}$ circuit acts as a linear projector of the bound feature, while the $W_{QK}$ positional circuit matches previous token representations, functionally equivalent to associative unbinding in high-dimensional algebra.</p>', 5),
('note-1', 'sec-5', '5. The Capacity Limit of Continuous Superposition', '<p>How many bound pairs $\mathbf{S} = \sum_{k=1}^K \mathbf{R}_k \circledast \mathbf{F}_k$ can be reliably retrieved from a single vector before signal-to-noise ratio degrades below the classification threshold? The exact signal-to-noise ratio is given by: $$\text{SNR} = \frac{D}{K - 1}$$</p><p>To maintain retrieval accuracy $1 - \delta$ across vocabulary $|\mathcal{V}|$, the maximum capacity scales linearly with dimensionality: $$K_{\text{max}} \approx \frac{D}{2 \ln |\mathcal{V}|}$$</p>', 6),
('note-1', 'sec-6', '6. Open Questions & Speculative Directions', '<p>Are non-abelian gauge group representations necessary for recursive compositional depth? We are currently designing experimental tests utilizing geometric deep learning on Lie algebras $\mathfrak{so}(3)$ to evaluate continuous variable binding in deep reinforcement learning agents.</p>', 7),

-- Note 2 Sections
('note-2', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We study non-linear dynamics of loss landscapes in simplified linear attention models, uncovering sharp second-order phase transitions during the formation of in-context induction capabilities.</div>', 1),
('note-2', 'sec-1', '1. Setup & Toy Architecture', '<p>Consider a 2-layer linear self-attention network without softmax non-linearities trained on $n$-gram Markov chains: $$f(X) = W_2 (W_1 X X^T W_1^T) X$$</p><p>We track spectral decomposition of weight matrices $W_1$ and $W_2$ under continuous gradient flow.</p>', 2),
('note-2', 'sec-2', '2. Spectral Bifurcation Dynamics', '<p>At critical step $t^* = \frac{1}{\sigma_{\text{min}}} \ln\left(\frac{1}{\eta}\right)$, the dominant singular value undergoes a pitchfork bifurcation: $$\frac{d\sigma_1}{dt} = \sigma_1 (\alpha - \beta \sigma_1^2)$$</p><p>This matches empirical observation of induction head formation across standard LLM training runs.</p>', 3),
('note-2', 'sec-3', '3. Empirical Verification & Loss Trajectories', '<p>Numerical simulations demonstrate exact power-law scaling in learning rate thresholds, proving that induction head emergence is governed by critical exponents analogous to thermodynamic phase transitions.</p>', 4),

-- Note 3 Sections
('note-3', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> Quantum state tomography of $N$-qubit density matrices suffers from exponential sample complexity. We formulate a geometric Riemannian prior constraining optimization to the manifold of physical density operators.</div>', 1),
('note-3', 'sec-1', '1. Reconstructing Density Matrices from Pauli Measurements', '<p>Quantum state tomography requires determining the complex density operator $\rho$ satisfying $\text{Tr}(\rho) = 1$ and $\rho \succeq 0$. Standard maximum likelihood methods frequently violate positive semi-definiteness under finite shot noise without computationally prohibitive semidefinite eigenvalue constraints.</p>', 2),
('note-3', 'sec-2', '2. Riemannian Quotient Manifold Formulation', '<p>By factorizing $\rho = Y Y^\dagger$ where $Y \in \mathbb{C}^{d \times r}$, the state space is modeled natively on the quotient manifold $\mathcal{M} = \mathbb{C}_*^{d \times r} / \mathcal{U}(r)$. The Riemannian gradient takes the exact form: $$\text{grad}_{\mathcal{M}} f(Y) = 2 \left( \nabla f(Y Y^\dagger) \right) Y - Y (Y^\dagger Y)^{-1} Y^\dagger (\nabla f) Y$$</p>', 3),
('note-3', 'sec-3', '3. Geodesic Optimization & Numerical Convergence', '<p>Geodesic updates follow the matrix exponential map along the horizontal subspace of the tangent space, guaranteeing physical validity at every step while achieving $3.4\times$ sample efficiency gains over standard maximum likelihood estimation.</p>', 4),

-- Note 4 Sections (Updated with 5 Comprehensive Sections)
('note-4', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We examine why neural networks fail to learn all available predictive features equally. During empirical risk minimization with cross-entropy loss, gradient descent prioritizes easily separable statistical shortcuts. As classification confidence approaches saturation, the vanishing gradient signal starves remaining robust core features, precipitating catastrophic performance collapse when exposed to out-of-distribution (OOD) shifts.</div>', 1),
('note-4', 'sec-1', '1. Neural Networks Have a Learning Bias', '<p>Neural networks do not learn all available features equally. During training, gradient descent naturally tends to prioritize features that are easier or stronger predictors of the target.</p><p>Imagine training a visual classifier to recognize cows. The input images contain multiple signals:</p><ul class="list-disc pl-5 space-y-1 my-3 text-neutral-700"><li><strong>Cow shape & anatomy</strong></li><li><strong>Green grass</strong> (high-contrast background)</li><li><strong>Sky</strong> and atmospheric tint</li><li><strong>Dominant background color palette</strong></li></ul><p>Suppose almost every cow image in the training dataset happens to contain lush green grass. The optimization trajectory discovers:</p><div class="my-4 p-3 bg-neutral-50 border-l-2 border-neutral-800 font-mono text-xs text-neutral-800">Green background &rarr; Cow &nbsp;&nbsp;(learned rapidly)<br>Shape / Texture &rarr; Cow &nbsp;&nbsp;&nbsp;&nbsp;(requires complex spatial composition)</div><p>Because the background color is an easy, low-frequency predictive signal, gradient descent gives it absolute priority. The model is not explicitly instructed which feature to rely on; optimization dictates feature utility based purely on which signals reduce empirical loss fastest.</p>', 2),
('note-4', 'sec-2', '2. Cross-Entropy Can Create Gradient Starvation', '<p>When training with cross-entropy loss, the loss function creates an insidious feature competition dynamic known as <strong>gradient starvation</strong>.</p><p>Suppose the model initially makes an uncertain prediction:</p><div class="my-3 p-3 bg-neutral-50 rounded font-mono text-xs text-neutral-700">Actual: Cat<br>Prediction: 55% Cat &nbsp;&rarr;&nbsp; High Loss &nbsp;&rarr;&nbsp; Strong Gradient &nabla;L</div><p>There is still a significant residual error, so the network receives large gradients and continues exploring multiple representation subspaces. However, as the easy shortcut feature is learned, prediction confidence surges:</p><div class="my-3 p-3 bg-neutral-50 rounded font-mono text-xs text-neutral-700">Actual: Cat<br>Prediction: 99.9% Cat &nbsp;&rarr;&nbsp; Loss &approx; 0 &nbsp;&rarr;&nbsp; Gradient &nabla;L &approx; 0</div><p>The optimization dynamics stall:</p><div class="my-4 p-4 bg-neutral-50 border border-neutral-200 rounded font-mono text-xs leading-loose text-neutral-800 text-center"><span class="font-bold">Strong easy feature</span> &rarr; <span class="font-bold">Confidence surges</span> &rarr; <span class="font-bold">Loss &darr;</span> &rarr; <span class="font-bold">Gradient &darr;</span> &rarr; <span class="font-bold">Remaining features starved of gradient signal</span></div><p>The problem is not that the other structural features (like whiskers, ear shapes, and anatomy) are uninformative; rather, the network <em>exhausts its gradient budget</em> before discovering them.</p>', 3),
('note-4', 'sec-3', '3. A Model Can Learn a Shortcut Without Memorizing Data', '<p>A common misconception in machine learning is that if a model relies on spurious cues, it must be overfitting or memorizing the training samples. <strong>This is not necessarily true.</strong></p><p>A network can learn a genuine, mathematically sound statistical correlation that holds true across the entire training distribution, yet represents the wrong conceptual invariant:</p><div class="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono"><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Training Distribution:</strong><br>Wolf &rarr; Snow background<br>Dog &rarr; Grass background</div><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Discovered Shortcut:</strong><br>Snow &rarr; Wolf<br>Grass &rarr; Dog</div></div><p>This is not memorization&mdash;the model generalized a statistical regularity present throughout the dataset. However, under environment intervention:</p><div class="my-3 p-3 bg-red-50/60 border border-red-200 rounded text-xs font-mono text-neutral-800">Wolf on Grass &rarr; Misclassified as Dog<br>Dog on Snow &rarr; Misclassified as Wolf</div><p>The model learned <code>Image &rarr; Background &rarr; Prediction</code> instead of <code>Image &rarr; Animal Characteristics &rarr; Prediction</code>. A shortcut can be statistically valid on the training distribution while remaining a flawed representation of the underlying task.</p>', 4),
('note-4', 'sec-4', '4. High Training Accuracy Isn''t Enough', '<p>Evaluating models purely on scalar metrics like Accuracy, Loss, or F1-Score obscures what internal representations the network actually constructed.</p><p>Consider two competing architectures:</p><div class="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono"><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Model A:</strong><br>Train Acc: 99% &nbsp;|&nbsp; Test Acc: 95%<br><em>Learned:</em> Background context &rarr; Class</div><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Model B:</strong><br>Train Acc: 98% &nbsp;|&nbsp; Test Acc: 96%<br><em>Learned:</em> Shape + Texture &rarr; Class</div></div><p>Standard benchmarks favor Model A. Yet when the background context shifts:</p><div class="my-3 p-3 bg-neutral-50 rounded text-xs font-mono">Model A performance collapses: 99% &rarr; 40%<br>Model B remains resilient: &nbsp;&nbsp;&nbsp; 98% &rarr; 93%</div><p class="font-medium text-black mt-3">Core Principle: A model can be right for the wrong reason.</p>', 5),
('note-4', 'sec-5', '5. Gradient Starvation Can Hurt OOD Generalization', '<p><strong>Out-of-Distribution (OOD)</strong> generalization measures how robustly a model behaves when real-world deployment data differs from the training distribution.</p><p>When a network is trained on correlated data (e.g., <em>Cow + Green grass</em>), the gradient starvation mechanism locks in the background shortcut:</p><div class="my-4 p-4 bg-neutral-50 border border-neutral-200 rounded font-mono text-xs leading-relaxed text-neutral-800 space-y-1.5"><div>1. Easy feature learns rapidly</div><div>2. Prediction confidence peaks &rarr; Gradient disappears</div><div>3. Morphological & invariant features remain unlearned</div><div>4. Model dependencies solidify around the shortcut</div><div>5. Environment shifts (Cow in Desert / Mountain / Snow)</div><div>6. Shortcut vanishes &rarr; <strong>OOD performance collapses</strong></div></div><p>Mitigating gradient starvation requires regularizers such as spectral decoupling, feature-dropout, and invariant risk minimization to force gradient flow into higher-order geometric representations.</p>', 6),

-- Note 5 Sections
('note-5', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We formulate continuous-time evidence lower bounds for latent paths governed by stochastic differential equations using Girsanov''s theorem and adjoint state backpropagation.</div>', 1),
('note-5', 'sec-1', '1. Continuous-Time Latent Trajectories & SDEs', '<p>Consider a latent continuous process $\mathbf{z}_t$ governed by: $$d\mathbf{z}_t = f_\theta(\mathbf{z}_t, t)dt + g(t)d\mathbf{w}_t$$</p><p>Applying Girsanov''s change of measure yields the exact continuous-time path KL divergence: $$\mathcal{D}_{\text{KL}}(q \,\|\, p) = \frac{1}{2} \mathbb{E}_q \left[ \int_0^T \left\| \frac{f_\theta(\mathbf{z}_t, t) - u_\phi(\mathbf{z}_t, t)}{g(t)} \right\|^2 dt \right]$$</p>', 2),
('note-5', 'sec-2', '2. Adjoint State Backpropagation & O(1) Memory', '<p>By integrating the continuous adjoint system in reverse time, parameter gradients are computed with $O(1)$ memory complexity regardless of the temporal discretization grid.</p>', 3);
