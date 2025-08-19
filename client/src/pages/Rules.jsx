export default function Rules() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <section className="max-w-2xl w-full mt-10 rounded-2xl bg-black/30 ring-1 ring-white/10 p-6 lg:p-8 text-center">
        <h3 className="font-heading text-2xl mb-3">Rules</h3>
        <p className="text-white/80">
          Each player starts with <span className="text-accent font-semibold">$500</span> to invest in survivors.
          Each week, as survivors are eliminated, any stock you’ve invested in them is lost.<br /><br />
          Before the season starts, each survivor stock costs <span className="text-accent font-semibold">$5</span>.<br /><br /> 
          Once the first episode is over, the prices start to vary based on the popularity of the survivor.
          Some survivors will drop below $5, while others will increase above $5 depending on how much stock is invested in them.<br /><br />
          In addition to prices changing based on popularity, the price of each survivor will increase <span className="text-accent font-semibold">20% every week</span> they continue in the game, meaning you are rewarded for investing in survivors who advance each week.<br /><br />  
          You must make the choice to invest in the more popular but also more expensive survivors or to try to find value with the less popular survivors. <br /><br />
          Whoever ends with the highest portfolio value at the end of the season is the winner of the <span className="text-accent font-semibold">Survivor Stock Exchange</span>.<br /><br />
          
        </p>
      </section>
    </div>
  );
}
