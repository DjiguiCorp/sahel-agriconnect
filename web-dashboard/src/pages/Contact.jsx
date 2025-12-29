import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    role: 'agriculteur',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation d'envoi
    console.log('Données soumises:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nom: '',
        email: '',
        role: 'agriculteur',
        message: ''
      });
    }, 3000);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact / Inscription</h1>
          <p className="text-lg text-gray-100 max-w-2xl mx-auto">
            Rejoignez le projet PTASS et participez à la transformation de l'agriculture au Sahel
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="section-container py-16">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-primary-green mb-6">
              Formulaire d'inscription
            </h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded text-green-800">
                <p className="font-semibold">✅ Inscription réussie !</p>
                <p className="text-sm mt-1">
                  Merci pour votre intérêt. Nous vous contacterons sous peu.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="agriculteur">Agriculteur</option>
                  <option value="cooperative">Coopérative</option>
                  <option value="investisseur">Investisseur</option>
                  <option value="partenaire">Partenaire technique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="Dites-nous en plus sur votre projet ou vos besoins..."
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Envoyer l'inscription
              </button>
            </form>
          </div>

          {/* Informations de contact */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold text-primary-green mb-4">
                📧 Contact Email
              </h3>
              <p className="text-gray-600">
                Pour toute question, contactez-nous à :
              </p>
              <a
                href="mailto:contact@sahelagriconnect.org"
                className="text-primary-blue hover:underline mt-2 inline-block"
              >
                contact@sahelagriconnect.org
              </a>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-primary-orange mb-4">
                📱 Application Mobile
              </h3>
              <p className="text-gray-600 mb-4">
                Téléchargez notre application pour accéder à toutes les fonctionnalités :
              </p>
              <a
                href="#"
                className="btn-secondary inline-block"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Application mobile bientôt disponible !');
                }}
              >
                Télécharger l'app
              </a>
            </div>
          </div>

          {/* Zones d'intervention */}
          <div className="mt-12 card bg-gradient-to-br from-primary-blue to-primary-darkblue text-white">
            <h3 className="text-2xl font-semibold mb-4">Zones d'Intervention</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🇲🇱 Mali</h4>
                <ul className="text-gray-100 text-sm space-y-1">
                  <li>• Bamako</li>
                  <li>• Ségou</li>
                  <li>• Koutiala</li>
                  <li>• Sikasso</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🇧🇫 Burkina Faso</h4>
                <ul className="text-gray-100 text-sm space-y-1">
                  <li>• Ouagadougou</li>
                  <li>• Bobo-Dioulasso</li>
                  <li>• Koudougou</li>
                  <li>• Fada N'gourma</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

