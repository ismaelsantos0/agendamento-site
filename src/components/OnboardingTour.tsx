import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useAuth } from '../hooks/useAuth';

interface OnboardingTourProps {
  clinicName: string;
  addressInfo: { cep: string; street: string };
  activeSettingsTab: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  clinicName,
  addressInfo,
  activeSettingsTab
}) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (user?.role === 'clinica') {
      const hasSeenTour = sessionStorage.getItem('onboarding_tour_completed');
      if (!hasSeenTour) {
        setRun(true);
      }
    }
  }, [user]);

  const steps: Step[] = [
    {
      target: '#tour-clinic-name',
      content: clinicName.length < 3 
        ? 'Bem-vindo! Para começar, digite o Nome da sua Clínica (mín. 3 letras).'
        : 'Perfeito! Clique em "Próximo".',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: true,
      hideFooter: clinicName.length < 3,
      spotlightClicks: true,
      placement: 'bottom',
    },
    {
      target: '#tour-clinic-address',
      content: (!addressInfo.cep || !addressInfo.street)
        ? 'Agora digite o seu CEP e deixe o sistema buscar a sua rua.'
        : 'Ótimo, endereço preenchido! Clique em "Próximo".',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: true,
      hideFooter: (!addressInfo.cep || !addressInfo.street),
      spotlightClicks: true,
      placement: 'top',
    },
    {
      target: '#tour-services-tab-btn',
      content: 'Clique nesta aba de Serviços para continuarmos.',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: true,
      hideFooter: activeSettingsTab !== 'services',
      spotlightClicks: true,
      placement: 'bottom',
    },
    {
      target: '#tour-services-form',
      content: 'Aqui você adiciona os serviços oferecidos pela sua clínica. Dica: Você pode usar os "Templates Rápidos" acima!',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: false,
      hideFooter: false,
      spotlightClicks: true,
      placement: 'top',
    },
    {
      target: '#tour-scheduling-rules',
      content: 'Aqui embaixo você define a duração média de cada consulta.',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: false,
      hideFooter: false,
      spotlightClicks: true,
      placement: 'top',
    },
    {
      target: '#tour-save-services-btn',
      content: 'Quando terminar de cadastrar seus serviços, não esqueça de clicar aqui para Salvar! 🎉',
      disableBeacon: true,
      disableOverlayClose: true,
      hideCloseButton: false,
      hideFooter: false,
      spotlightClicks: true,
      placement: 'top',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      sessionStorage.setItem('onboarding_tour_completed', 'true');
    }
  };

  useEffect(() => {
    if (activeSettingsTab === 'services' && stepIndex === 2) {
      setStepIndex(3);
    }
  }, [activeSettingsTab, stepIndex]);

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: '#0f766e',
          zIndex: 10000,
          textColor: '#1f2937',
        },
        tooltipContainer: {
          textAlign: 'left',
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: '#0f766e',
          fontSize: '12px',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#0f766e',
          fontSize: '12px',
        },
        buttonSkip: {
          color: '#ef4444',
          fontSize: '12px',
        }
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
    />
  );
};
