const features = [
  {
    category: "Business",
    title: "Comprehensive Auto Services",
    description:
      "From oil changes to engine repairs, we offer a wide range of services to keep your vehicle running smoothly.",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    date: "7 Feb 2023",
    views: 55,
    link: "Read More",
  },
  {
    category: "Workshop",
    title: "Experienced Mechanics",
    description:
      "Our team of certified mechanics has years of experience and is dedicated to providing top-notch service.",
    image:
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80",
    date: "10 Mar 2023",
    views: 92,
    link: "Read More",
  },
  {
    category: "Care",
    title: "Customer Satisfaction",
    description:
      "We prioritize customer satisfaction and strive to exceed your expectations with every visit.",
    image:
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1200&q=80",
    date: "22 Apr 2023",
    views: 138,
    link: "Read More",
  },
];

if (typeof window !== "undefined") {
  window.features = features;
}

module.exports = features;
