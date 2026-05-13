const children = [

  {
    id: 1,
    name: "Emma",
    age: 14,
    risk: "Mild Concern",
    riskScore: 32,
    stressLevel: "Moderate",

    alerts: [
      {
        title: "Emotional Distress Detected",
        severity: "Moderate",
        description:
          "AI noticed repeated negative self-talk and withdrawal indicators.",
      },

      {
        title: "Late Night Activity",
        severity: "Mild",
        description:
          "Unusual activity observed after midnight hours.",
      },
    ],

    notifications: [
      "Late-night activity increased",
      "Emotional stress indicators observed",
    ],
  },

  {
    id: 2,
    name: "Noah",
    age: 16,
    risk: "Safe",
    riskScore: 12,
    stressLevel: "Low",

    alerts: [
      {
        title: "Healthy Activity Pattern",
        severity: "Low",
        description:
          "No significant emotional or behavioral risks detected.",
      },
    ],

    notifications: [
      "Healthy digital activity maintained",
    ],
  },

  {
    id: 3,
    name: "Sophia",
    age: 13,
    risk: "High Risk",
    riskScore: 76,
    stressLevel: "High",

    alerts: [
      {
        title: "Potential Cyberbullying Risk",
        severity: "High",
        description:
          "Repeated harmful interaction patterns detected.",
      },

      {
        title: "Severe Sleep Disruption",
        severity: "High",
        description:
          "Continuous late-night activity observed over several days.",
      },
    ],

    notifications: [
      "Potential cyberbullying detected",
      "Severe sleep disruption identified",
      "High emotional stress observed",
    ],
  },

]

export default children