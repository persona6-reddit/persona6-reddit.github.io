/**
 * Reddit Clone — app.js
 * Interactive functionality: voting, comments, sharing, joining, toasts
 */

'use strict';

/* ─────────────────────────────────────────
   Utility
───────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, duration = 2800) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

/* ─────────────────────────────────────────
   POST VOTING
───────────────────────────────────────── */
const POST_INITIAL_VOTES = 52100;
let postVotes = POST_INITIAL_VOTES;
let postVoteState = 0; // 0 = none, 1 = up, -1 = down

const upvoteBtn   = $('#post-upvote');
const downvoteBtn = $('#post-downvote');
const voteCountEl = $('#post-vote-count');

function updatePostVoteUI() {
  voteCountEl.textContent = formatCount(postVotes);
  voteCountEl.classList.toggle('upvoted',   postVoteState ===  1);
  voteCountEl.classList.toggle('downvoted', postVoteState === -1);
  upvoteBtn.classList.toggle('active',   postVoteState ===  1);
  downvoteBtn.classList.toggle('active', postVoteState === -1);
  upvoteBtn.setAttribute('aria-pressed',   String(postVoteState ===  1));
  downvoteBtn.setAttribute('aria-pressed', String(postVoteState === -1));
}

upvoteBtn.addEventListener('click', () => {
  if (postVoteState === 1) {
    postVotes -= 1;
    postVoteState = 0;
  } else {
    postVotes += (postVoteState === -1 ? 2 : 1);
    postVoteState = 1;
  }
  updatePostVoteUI();
});

downvoteBtn.addEventListener('click', () => {
  if (postVoteState === -1) {
    postVotes += 1;
    postVoteState = 0;
  } else {
    postVotes -= (postVoteState === 1 ? 2 : 1);
    postVoteState = -1;
  }
  updatePostVoteUI();
});

/* ─────────────────────────────────────────
   COMMENT VOTING (delegated)
───────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.vote-btn.sm, .comment-action-btn.upvote-text');
  if (!btn) return;

  const commentEl = btn.closest('.comment');
  if (!commentEl) return;

  const scoreEl = commentEl.querySelector('.comment-score');
  const upvoteTxtBtn = commentEl.querySelector('.comment-action-btn.upvote-text');
  if (!scoreEl || !upvoteTxtBtn) return;

  // Parse current score
  const raw = scoreEl.textContent.trim().replace(/,/g, '');
  let score = parseInt(raw, 10);
  if (isNaN(score)) return;

  const isVoteBtn = btn.classList.contains('vote-btn');
  const isActionBtn = btn.classList.contains('comment-action-btn');

  // Toggle upvote state on the comment
  const alreadyUpvoted = commentEl.dataset.upvoted === 'true';

  if (alreadyUpvoted) {
    score -= 1;
    commentEl.dataset.upvoted = 'false';
    upvoteTxtBtn.classList.remove('upvoted');
    if (isVoteBtn) btn.classList.remove('active');
  } else {
    score += 1;
    commentEl.dataset.upvoted = 'true';
    upvoteTxtBtn.classList.add('upvoted');
    if (isVoteBtn) btn.classList.add('active');
  }

  const formatted = score.toLocaleString();
  scoreEl.textContent = formatted + ' points';
  upvoteTxtBtn.textContent = '▲ ' + formatted;
});

/* ─────────────────────────────────────────
   JOIN BUTTON
───────────────────────────────────────── */
let isJoined = false;

function handleJoin(btn) {
  isJoined = !isJoined;
  if (isJoined) {
    btn.textContent = 'Joined';
    btn.classList.add('joined');
    btn.setAttribute('aria-pressed', 'true');
    showToast('✅ You joined r/gaming!');
  } else {
    btn.textContent = 'Join';
    btn.classList.remove('joined');
    btn.setAttribute('aria-pressed', 'false');
    showToast('👋 You left r/gaming');
  }
}

$('#join-btn')?.addEventListener('click', function() { handleJoin(this); });
$('#sidebar-join-btn')?.addEventListener('click', function() {
  isJoined = !isJoined;
  const headerBtn = $('#join-btn');
  if (isJoined) {
    this.textContent = 'Joined';
    this.classList.add('joined');
    if (headerBtn) { headerBtn.textContent = 'Joined'; headerBtn.classList.add('joined'); }
    showToast('✅ You joined r/gaming!');
  } else {
    this.textContent = 'Join';
    this.classList.remove('joined');
    if (headerBtn) { headerBtn.textContent = 'Join'; headerBtn.classList.remove('joined'); }
    showToast('👋 You left r/gaming');
  }
});

/* ─────────────────────────────────────────
   SAVE BUTTON
───────────────────────────────────────── */
let isSaved = false;
const saveBtn = $('#save-btn');

saveBtn?.addEventListener('click', function() {
  isSaved = !isSaved;
  this.classList.toggle('saved', isSaved);
  this.setAttribute('aria-pressed', String(isSaved));
  showToast(isSaved ? '🔖 Post saved!' : '✕ Post unsaved');
});

/* ─────────────────────────────────────────
   SHARE BUTTON & MODAL
───────────────────────────────────────── */
const shareModal      = $('#share-modal');
const shareBtn        = $('#share-btn');
const closeShareModal = $('#close-share-modal');
const copyUrlBtn      = $('#copy-url-btn');

shareBtn?.addEventListener('click', () => {
  shareModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
});

function closeModal() {
  shareModal.style.display = 'none';
  document.body.style.overflow = '';
}

closeShareModal?.addEventListener('click', closeModal);
shareModal?.addEventListener('click', (e) => { if (e.target === shareModal) closeModal(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && shareModal.style.display === 'flex') closeModal();
});

copyUrlBtn?.addEventListener('click', () => {
  const input = $('#share-url-input');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('🔗 Link copied to clipboard!');
      copyUrlBtn.textContent = 'Copied!';
      setTimeout(() => { copyUrlBtn.textContent = 'Copy'; }, 2000);
      closeModal();
    });
  } else {
    input.select();
    document.execCommand('copy');
    showToast('🔗 Link copied!');
    closeModal();
  }
});

/* ─────────────────────────────────────────
   SORT BUTTONS — Post Sort
───────────────────────────────────────── */
$$('.sort-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    $$('.sort-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    showToast(`Sorting by: ${this.textContent.trim()}`);
  });
});

/* ─────────────────────────────────────────
   SORT BUTTONS — Comment Sort
───────────────────────────────────────── */
$$('.comment-sort-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    $$('.comment-sort-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
  });
});

/* ─────────────────────────────────────────
   COMMENT SUBMISSION
───────────────────────────────────────── */
const commentInput  = $('#new-comment-input');
const submitCommentBtn = $('#submit-comment-btn');
const commentsList  = $('#comments-list');
const loadMoreBtn   = $('#load-more-btn');

function generateAvatar() {
  const colors = [
    'linear-gradient(135deg,#7c3aed,#db2777)',
    'linear-gradient(135deg,#059669,#0284c7)',
    'linear-gradient(135deg,#dc2626,#ea580c)',
    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    'linear-gradient(135deg,#c026d3,#9333ea)',
    'linear-gradient(135deg,#16a34a,#15803d)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#b45309,#92400e)',
  ];
  const names = ['User', 'Gamer', 'Player', 'Redditor', 'Guest'];
  const randName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 999);
  const randColor = colors[Math.floor(Math.random() * colors.length)];
  const initials = randName.substring(0, 2).toUpperCase();
  return { name: randName, color: randColor, initials };
}

function timeAgo() { return 'just now'; }

function createCommentNode(text, user) {
  const div = document.createElement('div');
  div.className = 'comment new-comment';
  div.setAttribute('role', 'listitem');
  div.setAttribute('itemscope', '');
  div.setAttribute('itemtype', 'https://schema.org/Comment');

  div.innerHTML = `
    <div class="comment-vote-col" role="group" aria-label="Vote on comment">
      <button class="vote-btn upvote sm" aria-label="Upvote comment" aria-pressed="false">
        <svg viewBox="0 0 24 24" class="vote-arrow-sm" aria-hidden="true"><path d="M12 4l8 8H4z"/></svg>
      </button>
      <div class="comment-thread-line" aria-hidden="true"></div>
    </div>
    <div class="comment-body">
      <div class="comment-header">
        <div class="commenter-avatar" aria-hidden="true" style="background:${user.color}">${user.initials}</div>
        <a href="#" class="commenter-name" itemprop="author">${user.name}</a>
        <span class="op-tag" style="background:rgba(70,209,96,0.15);color:#16a34a">NEW</span>
        <span class="comment-score" itemprop="upvoteCount">1 point</span>
        <time class="comment-time" datetime="${new Date().toISOString()}" itemprop="datePublished">${timeAgo()}</time>
      </div>
      <div class="comment-text" itemprop="text">
        <p>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
      </div>
      <div class="comment-actions" role="toolbar" aria-label="Comment actions">
        <button class="comment-action-btn upvote-text">▲ 1</button>
        <button class="comment-action-btn">Reply</button>
        <button class="comment-action-btn">Share</button>
        <button class="comment-action-btn">Report</button>
      </div>
    </div>
  `;
  return div;
}

submitCommentBtn?.addEventListener('click', () => {
  const text = commentInput.innerText.trim();
  if (!text) {
    showToast('⚠️ Please write something first!');
    commentInput.focus();
    return;
  }

  const user = generateAvatar();
  const node = createCommentNode(text, user);

  // Insert after the load-more wrapper or at the beginning
  const loadMoreWrap = commentsList.querySelector('.load-more-wrap');
  if (loadMoreWrap) {
    commentsList.insertBefore(node, loadMoreWrap);
  } else {
    commentsList.appendChild(node);
  }

  commentInput.innerText = '';
  showToast('💬 Comment posted!');

  // Scroll to new comment
  setTimeout(() => {
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
});

/* Allow Ctrl+Enter to submit comment */
commentInput?.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    submitCommentBtn.click();
  }
});

/* ─────────────────────────────────────────
   REPLY BUTTONS (delegated)
───────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.comment-action-btn');
  if (!btn || btn.textContent.trim() !== 'Reply') return;

  const commentBody = btn.closest('.comment-body');
  if (!commentBody) return;

  // Remove existing reply boxes
  $$('.inline-reply-box').forEach(b => b.remove());

  const replyBox = document.createElement('div');
  replyBox.className = 'inline-reply-box add-comment-box';
  replyBox.style.cssText = 'padding:8px 0; margin-top:8px;';

  const user = generateAvatar();
  replyBox.innerHTML = `
    <div class="comment-avatar-sm" aria-hidden="true" style="background:${user.color};border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">${user.initials}</div>
    <div class="comment-input-wrap" style="flex:1">
      <div class="comment-input-area inline-reply-input" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Write your reply" tabindex="0" placeholder="Write a reply..." style="min-height:60px"></div>
      <div class="comment-toolbar" style="margin-top:6px">
        <span style="font-size:11px;color:#878a8c">Ctrl+Enter to submit</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm cancel-reply-btn">Cancel</button>
          <button class="btn btn-primary btn-sm submit-reply-btn">Reply</button>
        </div>
      </div>
    </div>
  `;

  commentBody.appendChild(replyBox);

  const input = replyBox.querySelector('.inline-reply-input');
  input.focus();

  // Cancel
  replyBox.querySelector('.cancel-reply-btn').addEventListener('click', () => replyBox.remove());

  // Submit reply
  const submitReply = () => {
    const text = input.innerText.trim();
    if (!text) return;

    let repliesContainer = commentBody.parentElement.querySelector('.replies');
    if (!repliesContainer) {
      repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies';
      commentBody.parentElement.appendChild(repliesContainer);
    }

    const node = createCommentNode(text, user);
    node.classList.add('reply');
    repliesContainer.appendChild(node);
    replyBox.remove();
    showToast('↩️ Reply posted!');
    setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  replyBox.querySelector('.submit-reply-btn').addEventListener('click', submitReply);
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitReply();
  });
});

/* ─────────────────────────────────────────
   LOAD MORE COMMENTS
───────────────────────────────────────── */
const moreComments = [
  {
    user: { name: 'GlitchHunter_Z', color: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', initials: 'GH' },
    text: 'I specifically asked three different people at my local game shop about this and every single one of them had the same reaction: completely floored by Act 2. There\'s something to be said for a game that can cross so many demographic lines.',
    score: '2,891',
    time: '10 hours ago',
  },
  {
    user: { name: 'ProbeThePast', color: 'linear-gradient(135deg,#059669,#1d4ed8)', initials: 'PP' },
    text: 'Coming from someone who bounced hard off Elden Ring (the difficulty just wasn\'t for me) — Aethoria hits the same notes of exploration and reward but with more accessible systems. I feel like I can finally access "that type" of game. Genuinely grateful it exists.',
    score: '1,774',
    time: '10 hours ago',
  },
  {
    user: { name: 'XP_Whisperer', color: 'linear-gradient(135deg,#dc2626,#7c3aed)', initials: 'XW' },
    text: 'The skill tree being "genuinely branching" is such an underrated point. I looked at 5 different endgame builds on YouTube and they\'re all viable and all feel completely different. That kind of build diversity takes serious design discipline.',
    score: '3,120',
    time: '9 hours ago',
  },
];

let moreLoaded = false;

loadMoreBtn?.addEventListener('click', () => {
  if (moreLoaded) {
    loadMoreBtn.textContent = 'All comments loaded';
    loadMoreBtn.disabled = true;
    return;
  }

  moreComments.forEach(({ user, text, score, time }) => {
    const div = document.createElement('div');
    div.className = 'comment';
    div.setAttribute('role', 'listitem');
    div.setAttribute('itemscope', '');
    div.setAttribute('itemtype', 'https://schema.org/Comment');
    div.innerHTML = `
      <div class="comment-vote-col" role="group" aria-label="Vote on comment">
        <button class="vote-btn upvote sm" aria-label="Upvote comment" aria-pressed="false">
          <svg viewBox="0 0 24 24" class="vote-arrow-sm" aria-hidden="true"><path d="M12 4l8 8H4z"/></svg>
        </button>
        <div class="comment-thread-line" aria-hidden="true"></div>
      </div>
      <div class="comment-body">
        <div class="comment-header">
          <div class="commenter-avatar" aria-hidden="true" style="background:${user.color}">${user.initials}</div>
          <a href="#" class="commenter-name" itemprop="author">${user.name}</a>
          <span class="comment-score" itemprop="upvoteCount">${score} points</span>
          <time class="comment-time" itemprop="datePublished">${time}</time>
        </div>
        <div class="comment-text" itemprop="text"><p>${text}</p></div>
        <div class="comment-actions" role="toolbar" aria-label="Comment actions">
          <button class="comment-action-btn upvote-text">▲ ${score}</button>
          <button class="comment-action-btn">Reply</button>
          <button class="comment-action-btn">Share</button>
          <button class="comment-action-btn">Report</button>
        </div>
      </div>
    `;
    const loadMoreWrap = commentsList.querySelector('.load-more-wrap');
    commentsList.insertBefore(div, loadMoreWrap);
  });

  moreLoaded = true;
  loadMoreBtn.textContent = 'All 3,842 comments loaded';
  loadMoreBtn.disabled = true;
  loadMoreBtn.style.opacity = '0.5';
  showToast('📜 Loaded more comments');
});

/* ─────────────────────────────────────────
   HIDE BUTTON
───────────────────────────────────────── */
$('#hide-btn')?.addEventListener('click', () => {
  const post = $('#post-main');
  post.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  post.style.opacity = '0.3';
  post.style.transform = 'scale(0.98)';
  showToast('👁️ Post hidden. Refresh to restore.');
});

/* ─────────────────────────────────────────
   CREATE POST / LOGIN BUTTONS
───────────────────────────────────────── */
$('#create-post-btn')?.addEventListener('click', () => showToast('✏️ Log in to create a post'));
$('#login-btn')?.addEventListener('click', () => showToast('🔐 Login functionality coming soon'));
$('#signup-btn')?.addEventListener('click', () => showToast('📧 Sign up functionality coming soon'));
$('#more-options-btn')?.addEventListener('click', () => showToast('⚙️ More options'));
$('#comment-btn')?.addEventListener('click', () => {
  $('#comments')?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => commentInput?.focus(), 500);
});

/* ─────────────────────────────────────────
   SHARE OPTION BUTTONS
───────────────────────────────────────── */
$$('.share-option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const label = btn.textContent.trim();
    showToast(`📤 Opening ${label}...`);
    setTimeout(closeModal, 400);
  });
});

/* ─────────────────────────────────────────
   RELATED COMMUNITY JOIN BUTTONS
───────────────────────────────────────── */
$$('.btn-join-sm').forEach(btn => {
  let joined = false;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    joined = !joined;
    const communityName = btn.closest('.related-item')?.querySelector('.related-name')?.textContent || 'community';
    if (joined) {
      btn.textContent = 'Joined';
      btn.style.background = 'var(--joined-bg)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--joined-bg)';
      showToast(`✅ Joined ${communityName}!`);
    } else {
      btn.textContent = 'Join';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  });
});

/* ─────────────────────────────────────────
   THREAD LINE COLLAPSE (click to collapse)
───────────────────────────────────────── */
$$('.comment-thread-line').forEach(line => {
  line.addEventListener('click', function() {
    const commentVoteCol = this.closest('.comment-vote-col');
    const comment = commentVoteCol?.closest('.comment');
    const body = comment?.querySelector('.comment-body');
    if (!body) return;

    const isCollapsed = body.style.display === 'none';
    body.style.transition = 'opacity 0.2s ease';

    if (isCollapsed) {
      body.style.display = '';
      body.style.opacity = '0';
      requestAnimationFrame(() => { body.style.opacity = '1'; });
      this.style.background = '';
    } else {
      body.style.opacity = '0';
      setTimeout(() => { body.style.display = 'none'; }, 200);
      this.style.background = 'var(--reddit-orange)';
      showToast('↕️ Comment collapsed — click the line to expand');
    }
  });
});

/* ─────────────────────────────────────────
   AWARD HOVER TOOLTIP
───────────────────────────────────────── */
$$('.award').forEach(award => {
  award.addEventListener('mouseenter', function() {
    showToast(`🏆 ${this.title}`);
  });
});

/* ─────────────────────────────────────────
   KEYBOARD ACCESSIBILITY
───────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  // J/K = navigate comments
  if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  if (e.key === 'j') {
    const comments = $$('.comment:not(.reply)');
    const focused = comments.findIndex(c => c.getBoundingClientRect().top > 80);
    if (focused !== -1) comments[Math.min(focused, comments.length - 1)].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (e.key === 'k') {
    const comments = $$('.comment:not(.reply)');
    const focused = comments.findIndex(c => c.getBoundingClientRect().top > 80);
    if (focused > 0) comments[focused - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
console.info(
  '%c r/gaming clone loaded ',
  'background:#FF4500;color:#fff;padding:4px 12px;border-radius:4px;font-weight:bold;font-size:14px;'
);
console.info('Press J/K to navigate comments. Ctrl+Enter to submit a comment.');
