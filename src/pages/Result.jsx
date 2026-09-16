import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'
import { supabase } from '../lib/supabase'

const moneyInsights = {
  aries: "Here's the truth about your money: you're not undercharging because you don't know your worth. You're undercharging because asking for what you're worth feels like being too much. So you hustle harder instead of charging more. Stop. Your energy is the product, and it's worth premium pricing.",
  taurus: "Let's be real about your money: you either hoard it out of fear or spend it to prove you're okay. Neither one is actually about money. It's about control. The moment you stop equating your bank balance with your safety is the moment money starts flowing toward you instead of away from you.",
  gemini: "Your money problem isn't that you have too many ideas. It's that you keep abandoning the ones that would actually pay because the next shiny thing feels more interesting. Pick one thing. Go all in. Boring is what makes you rich.",
  cancer: "Here's what's happening with your money: you're undercharging because you feel guilty taking money for something that comes naturally to you. You think charging more means you care less. That's backwards. The more you charge, the more you can give. Stop shrinking your prices to make other people comfortable.",
  leo: "Let's talk about your money: you're not struggling because you lack talent. You're struggling because you're waiting for someone to discover you instead of claiming your space. You don't need permission to charge what you're worth. You need to stop dimming your light so other people feel less threatened.",
  virgo: "Here's the thing about your money: you keep trying to perfect your offer before you put it out there. You think one more certification, one more revision, one more polish will make you ready. It won't. You're already ready. Charge for the work you're doing for free and watch what happens.",
  libra: "Your money wound is simple: you're afraid that charging what you're worth will make people not like you. So you discount, you over-deliver, you say yes to clients who can't afford you. Here's the truth: the right people will pay. The ones who won't were never your people anyway.",
  scorpio: "Let's be real about your money: you have a complicated relationship with power and control. You either use money as armor or you're afraid of what having it would mean. Your wealth lives on the other side of your fear of your own power. Stop shrinking.",
  sagittarius: "Here's your money pattern: you're great at making it and terrible at keeping it. You think money is freedom, but you spend it like it's burning a hole in your pocket. Freedom isn't spending everything you make. Freedom is having enough that you can say no.",
  capricorn: "Your money wound is that no amount is ever enough. You hit the goal and immediately move the goalpost. You're not chasing money. You're chasing the feeling of being enough. That feeling doesn't come from a bigger number in your bank account. It comes from finally deciding you're already enough.",
  aquarius: "Let's talk about your money: you're uncomfortable charging for your gifts because you think they should be free for everyone. But here's the thing: you can't change the world if you can't pay your bills. Charge. Build wealth. Use it as a tool for the revolution you're here to create.",
  pisces: "Here's what's really going on with your money: you're afraid that wanting money makes you less spiritual. So you undercharge, you give it away, you pretend you don't care about it. But money is just energy. And you blocking it is you blocking your own flow. Let it in.",
}

const trapInsights = {
  aries: "The trap: you keep fighting battles that aren't yours to prove you're strong enough. You don't have to fight for everything. Some things you can just... have. Try receiving without earning it.",
  taurus: "The trap: you stay in situations that have expired because change feels scarier than staying. But comfort that costs you your aliveness isn't comfort. It's a cage with nice furniture.",
  gemini: "The trap: you keep collecting information instead of taking action. You think if you just understand enough, you'll feel ready. You won't. Clarity comes from doing, not from thinking.",
  cancer: "The trap: you keep nurturing people who have no intention of nurturing you back. You think if you love them hard enough, they'll finally love you the way you need. They won't. Redirect that energy to yourself.",
  leo: "The trap: you keep performing for people who already love you. You don't have to earn their love. They're not here for the show. They're here for you. Take the costume off.",
  virgo: "The trap: you keep fixing people who didn't ask to be fixed. You think if you just help enough, you'll finally be enough. But your worth isn't tied to your usefulness. You are enough at rest.",
  libra: "The trap: you keep abandoning your own needs to keep the peace. But peace that requires you to disappear isn't peace. It's a hostage situation with better aesthetics.",
  scorpio: "The trap: you keep testing people to see if they'll stay, and then pushing away the ones who do. You think you're protecting yourself. You're actually just recreating the betrayal you're trying to avoid.",
  sagittarius: "The trap: you keep leaving the moment things get real. You call it following your truth. Sometimes it's actually just running from the discomfort of staying. Not everything that feels like a cage is one.",
  capricorn: "The trap: you keep achieving to prove you're not a failure, but the finish line keeps moving. You're running a race that has no end because the point was never the goal. The point was finally feeling like you matter.",
  aquarius: "The trap: you keep hiding your weirdness to fit in, then resenting people for not seeing the real you. They can't see what you won't show. Stop editing yourself for rooms you don't even want to be in.",
  pisces: "The trap: you keep absorbing everyone else's pain and calling it empathy. But drowning with someone doesn't save them. It just means there are two people drowning. Put on your own oxygen mask first.",
}

function getSignKey(chironSign) {
  if (!chironSign) return ''
  return chironSign.toLowerCase().trim()
}

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const name = searchParams.get('name')
  const chironSign = searchParams.get('chironSign')
  const chironHouse = searchParams.get('chironHouse')
  const chironDegree = searchParams.get('chironDegree')
  const shadowId = searchParams.get('shadowId')
  const email = searchParams.get('email')
  const resultId = searchParams.get('resultId')

  const shadowData = shadowMap[shadowId] || {
    archetype: 'Unknown',
    description: 'We could not determine your shadow at this time.'
  }

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const handleCheckout = async () => {
    if (!email || !resultId) {
      alert('Missing required information for checkout. Please run your chart again.')
      return
    }

    setIsRedirecting(true)

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email, resultId, name },
      })

      if (error || !data?.url) {
        console.error('Checkout error:', error)
        alert('Something went wrong starting checkout. Please try again.')
        setIsRedirecting(false)
        return
      }

      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Something went wrong starting checkout. Please try again.')
      setIsRedirecting(false)
    }
  }

  if (!name || !shadowId) {
    return (
      <>
        <TurbulentFlow />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ zIndex: 2 }}>
          <div className="text-center">
            <p className="text-white/70 text-lg mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              No results found. Run your birth chart first.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105"
              style={{ background: '#c3cd42', color: '#1E2220', fontFamily: "'Montserrat', sans-serif" }}
            >
              Run Your Chart
            </button>
          </div>
        </div>
      </>
    )
  }

  const archetypeName = shadowData.archetype.startsWith('The ')
    ? shadowData.archetype
    : `The ${shadowData.archetype}`

  const signKey = getSignKey(chironSign)
  const moneyText = moneyInsights[signKey] || ''
  const trapText = trapInsights[signKey] || ''

  return (
    <>
      <TurbulentFlow />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ zIndex: 2 }}>
        <div className="max-w-2xl w-full">

          {/* MAIN CARD */}
          <div className={`text-center mb-8 rounded-2xl p-8 md:p-10 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
            <div className="flex justify-center mb-5">
              <SparkleImage
                src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                alt="Your Shadow Map"
                className="w-24 h-24"
              />
            </div>

            <p className="text-base font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
              Your Shadow Map
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {name}
            </h1>

            <p className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
              {archetypeName}
            </p>

            <div className="inline-block rounded-xl px-6 py-4 mb-6" style={{ background: 'rgba(195,205,66,0.08)', border: '1px solid rgba(195,205,66,0.15)' }}>
              <p className="text-white/90 text-xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Chiron in <span className="font-semibold text-white">{chironSign}</span>
                {chironHouse && chironHouse !== 'Unknown' && (
                  <> in the <span className="font-semibold text-white">{chironHouse}</span></>
                )}
                {chironDegree && (
                  <> at <span className="font-semibold text-white">{parseFloat(chironDegree).toFixed(1)}°</span></>
                )}
              </p>
            </div>

            <p className="text-white/70 text-lg leading-relaxed max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {shadowData.description}
            </p>

            {/* THE PATTERN UNDERNEATH */}
            <div className="mt-7 pt-7 border-t border-white/10 text-left max-w-lg mx-auto">
              <p className="text-base font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
                The pattern underneath
              </p>
              <p className="text-white/85 text-lg leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Here's the thing about {archetypeName}: this isn't a label. It's the pattern underneath the pattern. You may have learned to edit yourself, over-give, stay guarded, or work twice as hard to feel safe. That strategy probably helped you once. It may also be the thing keeping you from feeling fully at home in your own life now.
              </p>
              <p className="text-white/85 text-lg leading-relaxed mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Your first question is simple: where are you still choosing approval, control, or belonging over being honest about what you actually need?
              </p>
            </div>
          </div>

          {/* MONEY SECTION */}
          {moneyText && (
            <div className={`rounded-2xl p-8 md:p-10 mb-8 transition-all duration-800 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
              <p className="text-base font-semibold uppercase tracking-[0.16em] mb-4" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
                Where this shows up in your money
              </p>
              <p className="text-white/85 text-lg leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {moneyText}
              </p>
            </div>
          )}

          {/* THE TRAP SECTION */}
          {trapText && (
            <div className={`rounded-2xl p-8 md:p-10 mb-8 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
              <p className="text-base font-semibold uppercase tracking-[0.16em] mb-4" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
                The trap you keep falling into
              </p>
              <p className="text-white/85 text-lg leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {trapText}
              </p>
            </div>
          )}

          {/* UPSELL CARD */}
          <div className={`rounded-2xl p-8 md:p-10 mb-8 text-center transition-all duration-800 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              This is just the surface.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-4 max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Your Chiron placement reveals the deepest shadow pattern running your entire life. Your relationships, your career, your money, your body, all of it.
            </p>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Get your full 26-page Shadow Map and see exactly how this wound has been operating behind the scenes, and how to flip it into the thing that actually gives you your edge.
            </p>

            <div className="space-y-3 mb-8 max-w-sm mx-auto text-left">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  How your wound shows up in relationships, career, money, and your body
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  The protection patterns you built (and why they're keeping you stuck)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Your hidden superpower and how to actually use it
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isRedirecting}
              className="inline-block font-bold tracking-wide px-10 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#c3cd42', color: '#1E2220', fontFamily: "'Montserrat', sans-serif" }}
            >
              {isRedirecting ? 'Redirecting to checkout...' : 'Get Your Full Shadow Map - $37'}
            </button>

            <p className="text-white/40 mt-4 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              26-page personalized deep dive delivered to your inbox
            </p>
          </div>

          <div className={`mt-10 text-center transition-all duration-800 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-white/40 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Questions? Email{' '}
              <a href="mailto:magic@lovelightandblackholes.com" className="transition-colors hover:text-white/60" style={{ color: '#c3cd42' }}>
                magic@lovelightandblackholes.com
              </a>
            </p>
          </div>

          <footer className="mt-6 text-center text-base text-white/40" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            This insight is intended to support your personal growth.
          </footer>
        </div>
      </div>
    </>
  )
}

export default Result
