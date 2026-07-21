import "./WhoCanUse.css";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function WhoCanUse() {

  return (

    <section className="who">

<div className="who-container">

<span className="who-badge">Platform Philosophy</span>

<h2 className="who-title">
A Healthier Social Experience
</h2>

<p className="who-desc">
Minimal Social is designed to keep social media simple and balanced.
You can connect with people, share updates, view stories and enjoy memes —
but everything is built with limits and intentional design so the platform
never becomes addictive or overwhelming.
</p>

<div className="who-grid">

<div className="who-card good">
<div className="who-icon good-icon">
<FaCheckCircle size={18} />
</div>

<h4>User Posts</h4>

<p>
Share updates, thoughts and moments with people you follow.
The focus is real interaction instead of chasing viral content.
</p>
</div>


<div className="who-card good">
<div className="who-icon good-icon">
<FaCheckCircle size={18} />
</div>

<h4>Stories</h4>

<p>
Post quick daily stories that disappear automatically.
A simple way to share moments without cluttering your profile.
</p>
</div>


<div className="who-card good">
<div className="who-icon good-icon">
<FaCheckCircle size={18} />
</div>

<h4>Private Messaging</h4>

<p>
Chat privately with friends and trusted people.
Designed for meaningful conversations without noise.
</p>
</div>


<div className="who-card good">
<div className="who-icon good-icon">
<FaCheckCircle size={18} />
</div>

<h4>Balanced Meme Feed</h4>

<p>
Enjoy memes in a controlled environment with daily time limits
so entertainment stays fun without endless scrolling.
</p>
</div>


<div className="who-card bad">
<div className="who-icon bad-icon">
<FaTimesCircle size={18} />
</div>

<h4>No Ads</h4>

<p>
There are absolutely no advertisements.
Your feed is never influenced by ad networks or sponsors.
</p>
</div>


<div className="who-card bad">
<div className="who-icon bad-icon">
<FaTimesCircle size={18} />
</div>

<h4>No Reels or Short Video Addiction</h4>

<p>
The platform avoids addictive short-video loops
designed to keep users scrolling endlessly.
</p>
</div>


<div className="who-card bad">
<div className="who-icon bad-icon">
<FaTimesCircle size={18} />
</div>

<h4>No Manipulative Algorithms</h4>

<p>
Content is not aggressively pushed to maximize screen time.
You mainly see updates from people you follow.
</p>
</div>


<div className="who-card bad">
<div className="who-icon bad-icon">
<FaTimesCircle size={18} />
</div>

<h4>No Influencer Pressure</h4>

<p>
This platform is not built around viral fame,
follower competition or influencer culture.
</p>
</div>

</div>

</div>

</section>);



}

export default WhoCanUse;