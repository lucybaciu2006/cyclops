import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { useLanguage } from "../../contexts/language.context";
import LanguageSelector from "@/components/LanguageSelector.tsx";
import React from "react";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8  py-4 text-[14px]">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="mb-5 block">
              <img className="h-[40px]" src="/logo.svg"/>
            </Link>
            <p className="text-gray-600">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-purple-600">
                <FaFacebook className="w-5 h-5"/>
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600">
                <FaInstagram className="w-5 h-5"/>
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600">
                <FaLinkedin className="w-5 h-5"/>
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600">
                <FaTwitter className="w-5 h-5"/>
              </a>
            </div>
            <div className="mt-4">
              <LanguageSelector/>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-gray-600 hover:text-purple-600">
                  {t('footer.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-600 hover:text-purple-600">
                  {t('footer.features')}
                </Link>
              </li>

              <li>
                <Link to="/faq" className="text-gray-600 hover:text-purple-600">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-purple-600">
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-gray-600 hover:text-purple-600">
                  {t('footer.demo')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-purple-600">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-purple-600">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                 <Link to="/terms" className="text-gray-600 hover:text-purple-600">
                  {t('footer.terms')}
                 </Link>
              </li>
              <li>
                 <Link to="/policy" className="text-gray-600 hover:text-purple-600">
                  {t('footer.privacy')}
                 </Link>
              </li>
              <li>
                 <Link to="/cookies" className="text-gray-600 hover:text-purple-600">
                  {t('footer.cookies')}
                 </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t flex flex-col md:flex-row justify-center items-center py-2">
          <p className="text-gray-600 text-sm">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}; 