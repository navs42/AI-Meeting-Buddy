import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const PresentationsPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Presentations</CardTitle>
      </CardHeader>
      <CardContent>
        {state.presentations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.presentations.map(presentation => (
              <Card key={presentation.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle as="h3" className="text-lg">{presentation.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-neutral-600 text-sm">{presentation.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/presentations/${presentation.id}`)}
                  >
                    View Presentation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">No presentations found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PresentationsPage;
