import React, { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SAMPLE_REPORT = `===WOUND_NAME===
The One Who Disappears

===SECTION_1: THE WOUND===
The Invisible Exit

You learned early that the safest move was to leave before anyone could ask you to. Not physically — though sometimes that too — but emotionally. You perfected the art of being present without being reachable. Smiling at dinner while already halfway out the door in your head.

Chiron in Aries in the 7th house means your wound lives in the space between you and everyone you've ever tried to love. Not because you can't love — you can, deeply, almost too much — but because somewhere along the way you decided that the version of you that shows up fully would be too much. Too intense. Too needy. Too something.

So you learned to dial it back. To give 70% and call it generous. To leave a little early, text back a little late, keep one foot out so that when it inevitably falls apart, you can say you saw it coming.

The thing is, you didn't see it coming. You caused it. Not maliciously — strategically. Because the alternative was standing still and being seen, and the last time you did that, it cost you something you're still not done paying for.

===SECTION_2: WHERE IT SHOWS UP===
The Pattern You Keep Running

This shows up everywhere, but it's loudest in your relationships. You pick partners who are safe — meaning they won't push too hard, won't demand full access, won't notice when you've emotionally checked out. And when someone does push? When someone says "I need more of you"? That's when you feel the ground shift.

It's not that you don't want to give more. It's that giving more feels like handing someone a weapon and hoping they won't use it. You've seen what happens when people get all of you. At least, you think you have.

At work, it shows up as the person who's brilliant in bursts but never stays long enough to build something. You change jobs, pivot projects, reinvent yourself — not because you're flaky, but because staying means being known, and being known means being pinned down, and being pinned down means someone can finally see the thing you've been hiding.

In friendships, you're the one people describe as "hard to pin down" or "independent." They mean it as a compliment. You hear it as confirmation that your disappearing act is working.

===SECTION_3: THE POWER===
What the Wound Built

Here's the part that's going to be annoying to hear: your wound made you extraordinary. The hypervigilance that keeps you scanning for exits? That's the same thing that makes you read a room in three seconds flat. The independence that keeps you from needing anyone? That's the engine behind every impressive thing you've ever built alone.

You are ruthlessly self-reliant. You can start over anywhere, with anyone, at any time. You've done it so many times it's practically a skill on your resume. While other people are paralyzed by change, you're already three moves ahead, because you've been rehearsing goodbye your entire life.

The sensitivity that makes closeness feel dangerous is the same sensitivity that makes you an incredible listener, an intuitive friend, and the person everyone comes to when they need someone who actually gets it. You feel everything — you just decided a long time ago that feeling everything out loud was too expensive.

Your Chiron gift is the ability to hold space for other people's intensity because you know exactly what it feels like to have too much inside you. You're the person who makes other people feel safe enough to fall apart — which is ironic, because you've never let anyone do that for you.

===SECTION_4: PUT IT TO WORK===
Making the Wound Work for You

Stop leaving before you're asked to. That's it. That's the whole assignment. But since you need a plan — because you always need a plan, that's the Aries in you — here's how.

Next time you feel the urge to pull back in a relationship, name it. Out loud. To the person you're pulling back from. Say: "I'm doing the thing where I disappear. I don't want to, but I don't know how to stay without it feeling like I'm going to lose something." That sentence will do more work than two years of therapy.

In your career, pick one thing and stay with it past the point of comfort. Not forever — just past the point where you'd normally bail. The magic isn't in the staying. The magic is in finding out that staying doesn't kill you.

Start telling people what you actually need. Not what's convenient, not what makes you easy to be around — what you need. You've spent so long being low-maintenance that you've forgotten you're allowed to have needs at all. You are. They're not too much.

===SECTION_5: READ THE PEOPLE YOU LOVE===
Seeing This Pattern in Others

Now that you know your Chiron pattern, you're going to start seeing it everywhere. Your best friend who always cancels plans at the last minute? That might be their version of the disappearing act. Your partner who shuts down during hard conversations? They might be running the same calculation you are: "If I stay present for this, I might get hurt."

The trick is recognizing that everyone's wound has a logic to it. Nobody's being difficult on purpose — they're being strategic, the same way you are. When you see someone you love pulling back, don't chase them. Don't punish them. Just say: "I see you. You don't have to disappear. I'm not going anywhere."

And then don't go anywhere. That's the hard part. Not because you don't mean it, but because every cell in your body will be screaming at you to protect yourself by leaving first. Don't. Stay. Let it be uncomfortable. Let it be terrifying. Let it be the thing that finally breaks the pattern.

Because the wound was never that people leave. The wound was that you decided to beat them to it.`

export default function TestPdf() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [pages, setPages] = useState(null)

  const generatePdf = async () => {
    setStatus('generating')
    setError(null)

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: 'Morgan Garza',
            email: 'test@example.com',
            chironSign: 'Aries',
            chironHouse: '7th House',
            chironDegree: '14°',
            shadowId: 'test-preview',
            report: SAMPLE_REPORT,
          }),
        }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setPages(data.pages)

      const byteChars = atob(data.pdfBase64)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i)
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'shadow-map-test-preview.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('done')
    } catch (err) {
      console.error('PDF generation failed:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1E2220',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: '#2a2e2c',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #3a3e3c',
      }}>
        <h1 style={{
          color: '#C3CD42',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          PDF Preview Tool
        </h1>
        <p style={{
          color: '#999',
          fontSize: '14px',
          marginBottom: '32px',
        }}>
          Generates a sample Shadow Map PDF with test data
        </p>

        <div style={{
          background: '#1E2220',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Name:</span> Morgan Garza
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Chiron:</span> Aries, 7th House
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Wound:</span> "The One Who Disappears"
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
            <span style={{ color: '#C3CD42' }}>Sections:</span> 5 (full sample report)
          </p>
        </div>

        <button
          onClick={generatePdf}
          disabled={status === 'generating'}
          style={{
            background: status === 'generating' ? '#666' : '#C3CD42',
            color: '#1E2220',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: status === 'generating' ? 'wait' : 'pointer',
            width: '100%',
            transition: 'all 0.2s',
            opacity: status === 'generating' ? 0.7 : 1,
          }}
        >
          {status === 'generating'
            ? 'Generating PDF...'
            : status === 'done'
              ? 'Generate Again'
              : 'Generate Test PDF'}
        </button>

        {status === 'generating' && (
          <p style={{ color: '#999', fontSize: '13px', marginTop: '16px' }}>
            Fetching fonts and building your PDF — this may take 10-15 seconds...
          </p>
        )}

        {status === 'done' && (
          <p style={{ color: '#C3CD42', fontSize: '14px', marginTop: '16px' }}>
            PDF downloaded! {pages && `(${pages} pages)`}
          </p>
        )}

        {status === 'error' && (
          <p style={{ color: '#e57373', fontSize: '14px', marginTop: '16px' }}>
            Something went wrong: {error}
          </p>
        )}

        <p style={{
          color: '#555',
          fontSize: '11px',
          marginTop: '32px',
        }}>
          This page is for internal testing only.
        </p>
      </div>
    </div>
  )
}
