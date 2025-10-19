import { Property } from '@/model/property';
import { PropertyService } from '@/services/PropertyService';
import React, {createContext, useContext, useState, ReactNode, useEffect, useRef} from 'react';
import { useAuth } from './auth.context';
import {DialogContent} from '@/components/ui/dialog.tsx';
import {CreatePropertyWizard} from '@/pages/dashboard/CreatePropertyWizard.tsx';
import {Dialog} from '@radix-ui/react-dialog';
import {useNavigate} from 'react-router-dom';
import LoadingScreen from "@/components/layout/LoadingScreen.tsx";

interface PropertyContextInterface {
  properties: Property[] | undefined;
  selectedProperty: Property | null;
  selectedPropertyId: string | undefined;
  updateProperty: (id: string, property: Property) => void;
  deleteProperty: (id: string) => void;
  selectProperty: (id: string | null) => void;
  openCreateProperty: () => void;
}

const PropertyContext = createContext<PropertyContextInterface | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[] | undefined>(undefined);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    properties && properties.length > 0 ? properties[0] : null
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    console.log('SELECTED PROPERTY CHANGED', selectedProperty?.name);
  }, [selectedProperty]);

  useEffect(() => {
    if (hasFetchedRef.current) return; // otherwise, in dev mode react will trigger this effect twice, leading to errors
    hasFetchedRef.current = true;

    PropertyService.getProperties()
        .then(properties => {
          setProperties(properties || []);
          const storedId = localStorage.getItem('selectedPropertyId');
          const match = properties?.find(p => p._id === storedId);

          if (match) {
            setSelectedProperty(match);
            setSelectedPropertyId(match._id);
          } else if (properties && properties.length > 0) {
            const first = properties[0];
            setSelectedProperty(first);
            setSelectedPropertyId(first._id);
            localStorage.setItem('selectedPropertyId', first._id);
          }
        })
        .catch(error => {
          console.error('Error fetching properties:', error);
          setProperties([]);
        });
  }, []);

  const updateProperty = (id: string, newProperty: Property) => {
    setProperties(prev =>
      prev.map(property =>
        property._id === id ? newProperty : property
      )
    );

    if (selectedProperty?._id === id) {
      setSelectedProperty(prev => prev ? newProperty : null);
    }
  };

  const deleteProperty = (id: string) => {
    const updated = properties!.filter(p => p._id !== id);
    setProperties(updated);

    if (selectedProperty?._id === id) {
      const next = updated.length > 0 ? updated[0] : null;
      setSelectedProperty(next);
      setSelectedPropertyId(next?._id);
      if (next) {
        localStorage.setItem('selectedPropertyId', next._id);
      } else {
        localStorage.removeItem('selectedPropertyId');
      }
    }
  };

  const selectProperty = (id: string | null) => {
    if (!id) {
      setSelectedProperty(null);
      setSelectedPropertyId(undefined);
      localStorage.removeItem('selectedPropertyId');
      return;
    }

    const property = properties.find(p => p._id === id);
    if (property) {
      setSelectedProperty(property);
      setSelectedPropertyId(property._id);
      localStorage.setItem('selectedPropertyId', property._id);
    }
  };

  const openCreateProperty = () => {
    setIsWizardOpen(true);
  }

  const closeCreateProperty = () => {
    setIsWizardOpen(false);
  }

  const handlePropertyCreated = (p: Property) => {
    closeCreateProperty();
    setProperties(properties => [...properties, p]);
    setSelectedProperty(p);
    setSelectedPropertyId(p._id);
    localStorage.setItem('selectedPropertyId', p._id);
    setTimeout(() => {
      navigate(`/properties/${p._id}/details`);
    }, 500);
  }

  if (properties === undefined) {
    return <LoadingScreen/>;
  }

  return (
    <PropertyContext.Provider
      value={{
        properties,
        selectedProperty,
        selectedPropertyId,
        updateProperty,
        deleteProperty,
        selectProperty,
        openCreateProperty
      }}
    >
      {children}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="w-[800px] max-w-full max-h-[90vh] bg-white flex flex-col overflow-hidden">
          <CreatePropertyWizard onSuccess={handlePropertyCreated} onDismiss={closeCreateProperty}/>
        </DialogContent>
      </Dialog>
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
