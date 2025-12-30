const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-green via-primary-lightgreen to-primary-orange text-white py-20">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Sahel AgriConnect
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-100">
            Digitalisation Souveraine de l'Agriculture
          </p>
          <p className="text-lg mb-8 text-gray-200">
            Plateforme innovante pour transformer l'agriculture au Mali, au Burkina Faso et au Niger
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#rejoindre"
              className="btn-secondary bg-white text-primary-green hover:bg-gray-100"
            >
              Rejoindre le projet
            </a>
            <a
              href="#"
              className="btn-primary bg-primary-orange hover:bg-primary-lightorange"
              onClick={(e) => {
                e.preventDefault();
                alert('Application mobile bientôt disponible !');
              }}
            >
              Télécharger l'app
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

