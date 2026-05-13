import StatCard from "./StatCard"

function SafetyPage() {

  return (

    <div className="grid grid-cols-4 gap-6">

      <StatCard
        title="Cyberbullying"
        value="18%"
        color="#9333ea"
      />

      <StatCard
        title="Grooming Risk"
        value="5%"
        color="#9333ea"
      />

      <StatCard
        title="Emotional Stress"
        value="32%"
        color="#9333ea"
      />

      <StatCard
        title="Addictive Usage"
        value="27%"
        color="#9333ea"
      />

    </div>

  )
}

export default SafetyPage