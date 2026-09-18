-- =========================================================================
-- Academic Notebook Portfolio SQLite Schema & Seed
-- Lightweight, self-contained, embedded database
-- =========================================================================

PRAGMA foreign_keys = ON;

-- 1. Metadata Table
CREATE TABLE IF NOT EXISTS portfolio_meta (
  id TEXT PRIMARY KEY DEFAULT 'main',
  author_name TEXT NOT NULL DEFAULT 'Karan',
  logo_text TEXT NOT NULL DEFAULT 'Karan',
  avatar_url TEXT DEFAULT 'avatar.jpg',
  page_title TEXT NOT NULL,
  meta_description TEXT,
  copyright_year INTEGER DEFAULT 2026,
  social_links TEXT DEFAULT '[]',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Hero Section Table
CREATE TABLE IF NOT EXISTS portfolio_hero (
  id TEXT PRIMARY KEY DEFAULT 'main',
  heading TEXT NOT NULL DEFAULT 'Notes and exploratory research.',
  bio_highlight TEXT NOT NULL DEFAULT 'Karan',
  bio_intro TEXT NOT NULL,
  more_about_text TEXT DEFAULT 'More about me.',
  more_about_anchor TEXT DEFAULT '#about'
);

-- 3. About Section Table
CREATE TABLE IF NOT EXISTS portfolio_about (
  id TEXT PRIMARY KEY DEFAULT 'main',
  section_label TEXT DEFAULT 'About & Focus',
  paragraphs TEXT NOT NULL
);

-- 4. Research Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'NOTE' CHECK (type IN ('ESSAY', 'NOTE', 'LOG', 'PAPER')),
  date TEXT NOT NULL,
  formatted_date TEXT NOT NULL,
  read_time TEXT NOT NULL DEFAULT '15 min',
  tags TEXT DEFAULT '[]',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  subtitle TEXT,
  published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Note Subsections Table (For Google Docs Outline Reader)
CREATE TABLE IF NOT EXISTS note_sections (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  section_anchor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(sort_order ASC, date DESC);
CREATE INDEX IF NOT EXISTS idx_note_sections_note_id ON note_sections(note_id, sort_order ASC);

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

INSERT OR IGNORE INTO portfolio_meta (id, author_name, logo_text, avatar_url, page_title, meta_description, copyright_year, social_links)
VALUES ('main', 'Karan', 'Karan', 'avatar.jpg', 'Karan — Notes & Exploratory Research (SQLite)', 'Personal notebook and exploratory research on learning algorithms, AI for science, and quantum computing.', 2026, '[{"platform":"GitHub","url":"https://github.com"},{"platform":"Twitter","url":"https://twitter.com"},{"platform":"Email","url":"mailto:karan@research.org"}]');

INSERT OR IGNORE INTO portfolio_hero (id, heading, bio_highlight, bio_intro, more_about_text, more_about_anchor)
VALUES ('main', 'Notes and exploratory research with local SQLite.', 'Karan', 'I think about learning algorithms, AI for science, and quantum computing.', 'More about me.', '#about');

INSERT OR IGNORE INTO portfolio_about (id, section_label, paragraphs)
VALUES ('main', 'About & Research Focus', '["I explore representations in neural systems, high-dimensional computing, and how algebraic mathematical structures translate into computational substrates.","Currently spending time writing notes, building small exploratory models, and reading literature across machine learning theory, cognitive architectures, and physics-informed computational frameworks."]');

-- Research Notes
INSERT OR IGNORE INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
VALUES ('note-1', 'bundling-binding-representation', 'ESSAY', '2026-04-22', 'Apr 22, 2026', '30 min', '["#hdc","#interpretability","#notes"]', 'Bundling, Binding, And Other Things Your Brain Probably Does, Or Not', 'An exploratory walk through the algebra of compositional representation.', 'An exploratory walk through the algebra of compositional representation and vector symbolic architectures.', 1, 1);
INSERT OR IGNORE INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
VALUES ('note-2', 'phase-transitions-linear-attention', 'NOTE', '2026-02-14', 'Feb 14, 2026', '14 min', '["#theory","#transformers","#mechanistic"]', 'Phase Transitions in Small Linear Attention Networks', 'Tracing sudden emergence of in-context induction capabilities across training trajectories in toy attention models.', 'Tracing sudden emergence of in-context induction capabilities across training trajectories in toy attention models.', 1, 2);
INSERT OR IGNORE INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
VALUES ('note-3', 'geometric-priors-quantum-tomography', 'NOTE', '2025-11-08', 'Nov 08, 2025', '22 min', '["#quantum","#geometry","#optimization"]', 'Geometric Priors for Quantum State Tomography', 'Constraining density matrix reconstruction using Riemannian manifold geometry and symmetry group invariants.', 'Constraining density matrix reconstruction using Riemannian manifold geometry and symmetry group invariants.', 1, 3);
INSERT OR IGNORE INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
VALUES ('note-4', 'gradient-starvation-spectral-bias', 'ESSAY', '2025-08-19', 'Aug 19, 2025', '18 min', '["#deep-learning","#spectral-bias","#gradient-starvation","#generalization"]', 'On Gradient Starvation and Spectral Bias in Deep ResNets', 'Why neural networks starve robust compositional features in favor of easy statistical shortcuts, and how cross-entropy induces failure under distribution shifts.', 'An inquiry into gradient starvation, shortcut learning, feature competition, and out-of-distribution generalization in deep networks.', 1, 4);
INSERT OR IGNORE INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
VALUES ('note-5', 'variational-inference-dynamical-systems', 'NOTE', '2025-05-03', 'May 03, 2025', '12 min', '["#variational-methods","#sde","#dynamics"]', 'Notes on Variational Inference for Continuous Dynamical Systems', 'A continuous-time formulation of evidence lower bounds (ELBO) parameterized with stochastic differential equations.', 'A continuous-time formulation of evidence lower bounds (ELBO) parameterized with stochastic differential equations.', 1, 5);

-- Note Sections
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('12f9f150-ca4a-4ddc-ba1b-c6cf77a31275', 'note-1', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> How do distributed continuous representations encode structured symbolic hierarchies without suffering exponential explosion in dimensionality? We examine Vector Symbolic Architectures (VSA / Hyperdimensional Computing) and mechanistic transformer interpretability to understand how biological neural circuits and continuous embeddings solve variable binding and compositionality.</div>', 1);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('810ee264-f2e2-4f9c-a808-e82f0a4251d6', 'note-1', 'sec-1', '1. The Superposition Dilemma & Symbolic Graphs', '<p>Classical symbolic AI represents complex compositions using discrete syntactic parse trees, pointer graphs, and recursive tuples. In biological neural tissue and continuous machine learning architectures, however, everything exists as a dense or sparse vector in high-dimensional hyperspace $\mathbb{R}^D$ where $D \ge 10^4$.</p><p>When multiple concepts are simultaneously activated in the same neural substrate, their raw activation patterns linearly superimpose. Without structured algebra, this leads to the classic <em>binding problem</em>: if the network activates $\text{Circle}$, $\text{Square}$, $\text{Red}$, and $\text{Blue}$, how does downstream circuitry know whether it is perceiving a $\text{Red Circle}$ and $\text{Blue Square}$, or a $\text{Blue Circle}$ and $\text{Red Square}$?</p>', 2);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('198359e0-e54d-45d3-aad5-9fd44dc3d215', 'note-1', 'sec-2', '2. Vector Symbolic Algebraic Operators', '<p>Vector Symbolic Architectures define an algebraic ring over high-dimensional hyperspaces with three fundamental operations:</p><ul class="list-disc pl-5 space-y-2 text-[#444444] text-[14.5px]"><li><strong>Bundling ($+$):</strong> Linear superposition representing approximate set union: $\mathbf{S} = \mathbf{A} + \mathbf{B}$. The resulting vector retains high cosine similarity with both constituents: $$\langle \mathbf{S}, \mathbf{A} \rangle \gg 0, \quad \langle \mathbf{S}, \mathbf{B} \rangle \gg 0$$</li><li><strong>Binding ($\otimes$):</strong> Quasi-orthogonal multiplication for variable-value binding: $\mathbf{P} = \mathbf{role} \otimes \mathbf{filler}$. Crucially, the bound product is near-orthogonal to its operands: $$\langle \mathbf{x} \otimes \mathbf{y}, \mathbf{x} \rangle \approx 0, \quad \langle \mathbf{x} \otimes \mathbf{y}, \mathbf{y} \rangle \approx 0$$</li><li><strong>Permutation ($\Pi$):</strong> Coordinate permutation encoding sequence order, syntactic dependency trees, and spatial coordinate grids without altering vector norm.</li></ul>', 3);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('0e34a515-723e-4299-b8bd-dde84e8b1861', 'note-1', 'sec-3', '3. Mathematical Formulation of Hyperdimensional Spaces', '<p>Consider a full scene description composed of multiple objects, each characterized by bound attribute pairs:</p><div class="my-4">$$\mathbf{Scene} = \left(\mathbf{Shape} \otimes \mathbf{Circle} + \mathbf{Color} \otimes \mathbf{Blue}\right) + \Pi\left(\mathbf{Shape} \otimes \mathbf{Square} + \mathbf{Color} \otimes \mathbf{Red}\right)$$</div><p>Because high-dimensional hyperspheres exhibit concentration of measure, any two randomly sampled independent vectors $\mathbf{u}, \mathbf{v} \sim \mathcal{S}^{D-1}$ satisfy: $$\mathbb{P}\left( |\langle \mathbf{u}, \mathbf{v} \rangle| > \frac{\epsilon}{\sqrt{D}} \right) \le 2 e^{-\frac{\epsilon^2}{2}}$$</p><p>This geometric orthogonality ensures that cross-talk interference terms act as bounded Gaussian noise.</p>', 4);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('a82e7a2e-1524-4aa2-86a7-b7c003396e27', 'note-1', 'sec-4', '4. Unbinding, Clean-Up Memories, and Noise Tolerance', '<p>To query a composite vector for a specific role filler, we perform algebraic unbinding by multiplying with the exact pseudoinverse of the role key:</p><div class="my-4">$$\mathbf{Query} = \mathbf{Shape}^{-1} \otimes \mathbf{Scene} = \mathbf{Circle} + \mathbf{noise}_{\text{cross-talk}}$$</div><p>Passing $\mathbf{Query}$ through an associative clean-up dictionary memory $\mathcal{M} = \{ \mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_K \}$ cleanly extracts $\mathbf{Circle}$ with near-zero error probability when dimensionality $D \ge 10^4$.</p>', 5);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('5d81a706-1a50-41ff-8d0c-a35fdfcc63c4', 'note-1', 'sec-5', '5. Neural Substrates and Mechanistic Interpretability', '<p>Does modern deep learning — specifically transformer self-attention — discover a continuous approximation of hyperdimensional binding?</p><p>Recent mechanistic interpretability findings in attention induction heads demonstrate that early layers project continuous key-query pairs into orthogonal subspaces, effectively performing algebraic role-filler separation across induction circuits.</p>', 6);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('140dc3c3-8174-4db9-ac4a-c0114aebb442', 'note-1', 'sec-6', '6. Open Questions & Future Directions', '<p>Key challenges remain in scaling differentiable VSA:</p><ol class="list-decimal pl-5 space-y-1.5 text-[#444444] text-[14px]"><li>Can hardware neuromorphic crossbars compute circular convolution binding in continuous analog time?</li><li>How can gradient descent directly optimize unbinding memories without discrete winner-take-all bottlenecks?</li><li>Bridging topological quantum computing with high-dimensional algebraic states.</li></ol>', 7);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('2533fbd5-8b90-45df-8060-2de532aca764', 'note-2', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We study the training dynamics of a 2-layer linear attention model on synthetic Markovian n-gram tasks. We show that in-context induction capabilities emerge as a sharp discontinuous phase transition driven by spectral alignment of query-key weight products.</div>', 1);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('6d54eacf-3d23-44ef-a9e9-97255015e8a9', 'note-2', 'sec-1', '1. The Mystery of In-Context Induction', '<p>During pre-training of transformer architectures, empirical evaluation curves often display extended loss plateaus followed by an abrupt, steep descent. During this sudden jump, networks rapidly acquire the ability to copy tokens and perform in-context sequence induction.</p>', 2);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('ebbb679b-026d-4205-ac78-97da63703af5', 'note-2', 'sec-2', '2. Minimal Model Architecture & Mathematical Setup', '<p>We isolate a minimal 2-layer linear self-attention network without non-linear MLPs. Given input sequence $\mathbf{X} \in \mathbb{R}^{L \times d}$, the attention operator computes: $$\mathbf{A}^{(1)} = \mathbf{X} W_Q^{(1)} \left( W_K^{(1)} \right)^T \mathbf{X}^T, \quad \mathbf{Z} = \mathbf{A}^{(1)} \mathbf{X} W_V^{(1)}$$</p>', 3);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('54dd0545-3003-4102-86a5-6106384f8e15', 'note-2', 'sec-3', '3. Spectral Dynamics of Query-Key Matrices', '<p>By performing singular value decomposition on $M = W_Q^{(2)} (W_K^{(2)})^T$, we observe that throughout the initial training plateau, the singular values remain near zero while the principal singular vectors rotate silently: $$\frac{d}{dt} \mathbf{u}_1(M) \propto \eta \cdot \left( \Sigma_{\text{data}} \otimes \mathcal{H} \right) \mathbf{v}_1(M)$$</p>', 4);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('5c6013b7-3e95-4b5b-831b-21b9e9415dd4', 'note-2', 'sec-4', '4. Critical Phase Bifurcation & Gradient Dynamics', '<p>Once vector alignment exceeds a critical geometric threshold $\tau^*$, the gradient signal undergoes positive feedback, causing singular value $\sigma_1(M)$ to explode from $\approx 0.01$ to $4.8$ within fewer than 150 gradient steps.</p>', 5);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('bfb05358-a631-4d2c-9fbb-2d0f296bfd92', 'note-3', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> Reconstructing density matrices $\rho \in \mathbb{C}^{2^N \times 2^N}$ under experimental Pauli noise poses steep ill-posed optimization challenges. We formulate state estimation on the Riemannian quotient manifold $\mathcal{S}_+(r, d) / \mathcal{U}(r)$, ensuring physical validity natively.</div>', 1);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('97a189f2-7696-4f84-baae-cdf06ab302f8', 'note-3', 'sec-1', '1. Reconstructing Density Matrices from Pauli Measurements', '<p>Quantum state tomography requires determining the complex density operator $\rho$ satisfying unit trace $\text{Tr}(\rho) = 1$ and positive semi-definiteness $\rho \succeq 0$. Standard gradient descent with Lagrangian penalties frequently violates physical eigenvalue constraints.</p>', 2);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('82ca74dd-4edf-4879-963e-f6da859a414a', 'note-3', 'sec-2', '2. Riemannian Quotient Manifold Formulation', '<p>By factorizing $\rho = Y Y^\dagger$ where $Y \in \mathbb{C}^{d \times r}$, the state space is modeled natively on the quotient manifold $\mathcal{M} = \mathbb{C}_*^{d \times r} / \mathcal{U}(r)$. The Riemannian gradient takes the exact form: $$\text{grad}_{\mathcal{M}} f(Y) = 2 \left( \nabla f(Y Y^\dagger) \right) Y - Y (Y^\dagger Y)^{-1} Y^\dagger (\nabla f) Y$$</p>', 3);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('c97af2bd-553d-446e-ac91-9f93fe807eae', 'note-3', 'sec-3', '3. Geodesic Optimization & Numerical Convergence', '<p>Geodesic updates follow the matrix exponential map along the horizontal subspace of the tangent space, guaranteeing physical validity at every step while achieving $3.4\times$ sample efficiency gains over standard maximum likelihood estimation.</p>', 4);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('687e3045-cc3b-4a17-a29e-c21244d7a2cc', 'note-4', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We examine why neural networks fail to learn all available predictive features equally. During empirical risk minimization with cross-entropy loss, gradient descent prioritizes easily separable statistical shortcuts. As classification confidence approaches saturation, the vanishing gradient signal starves remaining robust core features, precipitating catastrophic performance collapse when exposed to out-of-distribution (OOD) shifts.</div>', 1);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('7a7ed360-02ad-4e6d-8a92-4f321c31ade9', 'note-4', 'sec-1', '1. Neural Networks Have a Learning Bias', '<p>Neural networks do not learn all available features equally. During training, gradient descent naturally tends to prioritize features that are easier or stronger predictors of the target.</p><p>Imagine training a visual classifier to recognize cows. The input images contain multiple signals:</p><ul class="list-disc pl-5 space-y-1 my-3 text-[#444]"><li><strong>Cow shape & anatomy</strong></li><li><strong>Green grass</strong> (high-contrast background)</li><li><strong>Sky</strong> and atmospheric tint</li><li><strong>Dominant background color palette</strong></li></ul><p>Suppose almost every cow image in the training dataset happens to contain lush green grass. The optimization trajectory discovers:</p><div class="my-4 p-3 bg-neutral-50 border-l-2 border-neutral-800 font-mono text-xs text-neutral-800">Green background &rarr; Cow &nbsp;&nbsp;(learned rapidly)<br>Shape / Texture &rarr; Cow &nbsp;&nbsp;&nbsp;&nbsp;(requires complex spatial composition)</div><p>Because the background color is an easy, low-frequency predictive signal, gradient descent gives it absolute priority. The model is not explicitly instructed which feature to rely on; optimization dictates feature utility based purely on which signals reduce empirical loss fastest.</p>', 2);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('88c9c81e-d084-426f-a3cc-ad52371106e7', 'note-4', 'sec-2', '2. Cross-Entropy Can Create Gradient Starvation', '<p>When training with cross-entropy loss, the loss function creates an insidious feature competition dynamic known as <strong>gradient starvation</strong>.</p><p>Suppose the model initially makes an uncertain prediction:</p><div class="my-3 p-3 bg-neutral-50 rounded font-mono text-xs text-neutral-700">Actual: Cat<br>Prediction: 55% Cat &nbsp;&rarr;&nbsp; High Loss &nbsp;&rarr;&nbsp; Strong Gradient &nabla;L</div><p>There is still a significant residual error, so the network receives large gradients and continues exploring multiple representation subspaces. However, as the easy shortcut feature is learned, prediction confidence surges:</p><div class="my-3 p-3 bg-neutral-50 rounded font-mono text-xs text-neutral-700">Actual: Cat<br>Prediction: 99.9% Cat &nbsp;&rarr;&nbsp; Loss &approx; 0 &nbsp;&rarr;&nbsp; Gradient &nabla;L &approx; 0</div><p>The optimization dynamics stall:</p><div class="my-4 p-4 bg-neutral-50 border border-neutral-200 rounded font-mono text-xs leading-loose text-neutral-800 text-center"><span class="font-bold">Strong easy feature</span> &rarr; <span class="font-bold">Confidence surges</span> &rarr; <span class="font-bold">Loss &darr;</span> &rarr; <span class="font-bold">Gradient &darr;</span> &rarr; <span class="font-bold">Remaining features starved of gradient signal</span></div><p>The problem is not that the other structural features (like whiskers, ear shapes, and anatomy) are uninformative; rather, the network <em>exhausts its gradient budget</em> before discovering them.</p>', 3);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('81b12e60-b4f0-41f0-b876-7c11c0ae75b0', 'note-4', 'sec-3', '3. A Model Can Learn a Shortcut Without Memorizing Data', '<p>A common misconception in machine learning is that if a model relies on spurious cues, it must be overfitting or memorizing the training samples. <strong>This is not necessarily true.</strong></p><p>A network can learn a genuine, mathematically sound statistical correlation that holds true across the entire training distribution, yet represents the wrong conceptual invariant:</p><div class="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono"><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Training Distribution:</strong><br>Wolf &rarr; Snow background<br>Dog &rarr; Grass background</div><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Discovered Shortcut:</strong><br>Snow &rarr; Wolf<br>Grass &rarr; Dog</div></div><p>This is not memorization&mdash;the model generalized a statistical regularity present throughout the dataset. However, under environment intervention:</p><div class="my-3 p-3 bg-red-50/60 border border-red-200 rounded text-xs font-mono text-neutral-800">Wolf on Grass &rarr; Misclassified as Dog<br>Dog on Snow &rarr; Misclassified as Wolf</div><p>The model learned <code>Image &rarr; Background &rarr; Prediction</code> instead of <code>Image &rarr; Animal Characteristics &rarr; Prediction</code>. A shortcut can be statistically valid on the training distribution while remaining a flawed representation of the underlying task.</p>', 4);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('c6f9cf81-f7df-4914-9c6b-0282032b1bf6', 'note-4', 'sec-4', '4. High Training Accuracy Isn''t Enough', '<p>Evaluating models purely on scalar metrics like Accuracy, Loss, or F1-Score obscures what internal representations the network actually constructed.</p><p>Consider two competing architectures:</p><div class="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono"><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Model A:</strong><br>Train Acc: 99% &nbsp;|&nbsp; Test Acc: 95%<br><em>Learned:</em> Background context &rarr; Class</div><div class="p-3 bg-neutral-50 border border-neutral-200 rounded"><strong>Model B:</strong><br>Train Acc: 98% &nbsp;|&nbsp; Test Acc: 96%<br><em>Learned:</em> Shape + Texture &rarr; Class</div></div><p>Standard benchmarks favor Model A. Yet when the background context shifts:</p><div class="my-3 p-3 bg-neutral-50 rounded text-xs font-mono">Model A performance collapses: 99% &rarr; 40%<br>Model B remains resilient: &nbsp;&nbsp;&nbsp; 98% &rarr; 93%</div><p class="font-medium text-black mt-3">Core Principle: A model can be right for the wrong reason.</p>', 5);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('0cf3ab9b-3af0-406d-ad92-2cebae88f5ae', 'note-4', 'sec-5', '5. Gradient Starvation Can Hurt OOD Generalization', '<p><strong>Out-of-Distribution (OOD)</strong> generalization measures how robustly a model behaves when real-world deployment data differs from the training distribution.</p><p>When a network is trained on correlated data (e.g., <em>Cow + Green grass</em>), the gradient starvation mechanism locks in the background shortcut:</p><div class="my-4 p-4 bg-neutral-50 border border-neutral-200 rounded font-mono text-xs leading-relaxed text-neutral-800 space-y-1.5"><div>1. Easy feature learns rapidly</div><div>2. Prediction confidence peaks &rarr; Gradient disappears</div><div>3. Morphological & invariant features remain unlearned</div><div>4. Model dependencies solidify around the shortcut</div><div>5. Environment shifts (Cow in Desert / Mountain / Snow)</div><div>6. Shortcut vanishes &rarr; <strong>OOD performance collapses</strong></div></div><p>Mitigating gradient starvation requires regularizers such as spectral decoupling, feature-dropout, and invariant risk minimization to force gradient flow into higher-order geometric representations.</p>', 6);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('638a1748-bd1a-49cd-ad15-1394426dc370', 'note-5', 'abstract', 'Abstract', '<div class="p-4 sm:p-5 bg-neutral-50 border border-neutral-200/80 rounded-md text-[14px] leading-relaxed text-neutral-700 italic"><strong>Abstract —</strong> We formulate continuous-time evidence lower bounds for latent paths governed by stochastic differential equations using Girsanov''s theorem and adjoint state backpropagation.</div>', 1);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('6db87b0a-31ac-46d7-8c38-7a8d0df95851', 'note-5', 'sec-1', '1. Continuous-Time Latent Trajectories & SDEs', '<p>Consider a latent continuous process $\mathbf{z}_t$ governed by: $$d\mathbf{z}_t = f_\theta(\mathbf{z}_t, t)dt + g(t)d\mathbf{w}_t$$</p><p>Applying Girsanov''s change of measure yields the exact continuous-time path KL divergence: $$\mathcal{D}_{\text{KL}}(q \,\|\, p) = \frac{1}{2} \mathbb{E}_q \left[ \int_0^T \left\| \frac{f_\theta(\mathbf{z}_t, t) - u_\phi(\mathbf{z}_t, t)}{g(t)} \right\|^2 dt \right]$$</p>', 2);
INSERT OR IGNORE INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
VALUES ('b6dc214d-0def-4e8c-82de-00022696f642', 'note-5', 'sec-2', '2. Adjoint State Backpropagation & O(1) Memory', '<p>By integrating the continuous adjoint system in reverse time, parameter gradients are computed with $O(1)$ memory complexity regardless of the temporal discretization grid.</p>', 3);
