export default function Rules() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <section className="max-w-2xl w-full mt-10 rounded-2xl bg-black/30 ring-1 ring-white/10 p-6 lg:p-8 text-center">
        <h3 className="font-heading text-2xl mb-3">Rules</h3>
        <p className="text-white/80">
          Welcome to the <span className="text-accent font-semibold">Survivor Stock Exchange</span>! 
          Play on your own or invite your friends and compete in a <span className="text-accent font-semibold">group</span>. 
          Groups can be as small as two players or as large as you want. Missed the first week? No problem. 
          You can join or create a group at <span className="text-accent font-semibold">any time</span>.<br /><br />

          Each player starts with <span className="text-accent font-semibold">$100</span> to invest in 
          <span className="text-accent font-semibold"> survivor stocks</span>. 
          Each week, as survivors are eliminated, any stock you’ve invested in them is 
          <span className="text-accent font-semibold"> lost</span>.<br /><br />

          Initially, each survivor stock costs <span className="text-accent font-semibold">$1</span>. 
          Prices increase in <span className="text-accent font-semibold">$1 increments</span> as more stock is purchased, 
          capping out at <span className="text-accent font-semibold">$5 per share</span>. 
          There is also a <span className="text-accent font-semibold">share cap</span> on each survivor. 
          The more members in your group, the more total shares can be purchased per survivor
          and the longer it takes for the price to increase by <span className="text-accent font-semibold">$1</span>.<br /><br /> 

          During each episode, stock you own can earn 
          <span className="text-accent font-semibold"> bonus money</span> if your survivor wins a challenge, 
          finds an idol, plays an idol correctly, or votes on the correct side of the numbers. 
          You’ll also receive a <span className="text-accent font-semibold">major bonus</span> if you hold stock 
          in the <span className="text-accent font-semibold">Sole Survivor</span> at the end of the game.<br /><br />

          There is also a <span className="text-accent font-semibold">side game</span> to earn extra cash. 
          Pick the five survivors you think are most likely to go home each week. 
          Rank them in order and earn the highest bonus if your top pick is voted out. 
          The more accurate your prediction, the bigger the 
          <span className="text-accent font-semibold"> weekly payout</span>.<br /><br />

          You can buy and sell stock throughout the episode except during 
          <span className="text-accent font-semibold"> Tribal Council</span>. 
          However, <span className="text-accent font-semibold">player trades</span> within your group 
          are allowed at any time even up to the last second before the votes are read. 
          Trades may be crucial if a survivor’s share cap has been reached and another member 
          is willing to negotiate.<br /><br /> 

          Will you invest in the more popular but more expensive survivors? 
          Or will you search for hidden value among under-the-radar players? 
          You can build a portfolio around likely finalists, dominant challenge performers, 
          or strategic masterminds. Whatever your strategy, 
          <span className="text-accent font-semibold"> outwit</span>, 
          <span className="text-accent font-semibold"> outplay</span>, and 
          <span className="text-accent font-semibold"> outlast</span> your friends.<br /><br />

          The player with the highest 
          <span className="text-accent font-semibold"> portfolio value </span> 
          at the end of the season wins the 
          <span className="text-accent font-semibold"> Survivor Stock Exchange</span>!
        </p>
      </section>
    </div>
  );
}
